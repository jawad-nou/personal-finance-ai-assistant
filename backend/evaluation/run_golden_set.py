"""Run the Case 2 golden set against a signed-in synthetic demo account."""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal
from pathlib import Path


API_BASE = os.environ.get("FINANCE_ASSISTANT_API_URL", "http://localhost:5000/api").rstrip("/")
TOKEN = os.environ.get("FINANCE_ASSISTANT_TOKEN", "")
GOLDEN_SET = Path(__file__).with_name("golden_set.json")


def api_request(path, method="GET", payload=None):
    if not TOKEN:
        raise RuntimeError("Set FINANCE_ASSISTANT_TOKEN to a JWT for the isolated synthetic demo account.")
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{API_BASE}{path}",
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"API returned HTTP {error.code}: {detail}") from error


def money_values(items):
    text = " ".join(str(item.get("value", "")) for item in items)
    return {
        Decimal(value.replace(",", "")) * (-1 if sign else 1)
        for sign, value in re.findall(r"(-?)\$([\d,]+(?:\.\d{1,2})?)", text)
    }


def numeric_values(value):
    if isinstance(value, bool):
        return set()
    if isinstance(value, (int, float)):
        return {Decimal(str(value))}
    if isinstance(value, dict):
        return set().union(*(numeric_values(item) for item in value.values())) if value else set()
    if isinstance(value, list):
        return set().union(*(numeric_values(item) for item in value)) if value else set()
    return set()


def text_values(value):
    if isinstance(value, str):
        return {value.casefold()}
    if isinstance(value, dict):
        return set().union(*(text_values(item) for item in value.values())) if value else set()
    if isinstance(value, list):
        return set().union(*(text_values(item) for item in value)) if value else set()
    return set()


def budget_amount(month, category):
    query = urllib.parse.urlencode({"month": month})
    budgets = api_request(f"/budgets?{query}")
    match = next((row for row in budgets if str(row.get("category_name", "")).casefold() == category.casefold()), None)
    return None if match is None else Decimal(str(match["amount"]))


def run_case(case):
    before_budget = None
    if case.get("mustNotWriteBeforeApproval"):
        arguments = case["expectedArguments"]
        before_budget = budget_amount(arguments["month"], arguments["categoryName"])

    reply = api_request("/assistant/message", "POST", {"question": case["question"]})
    actual_calls = reply.get("toolsUsed", [])
    expected_tool = case.get("expectedTool")
    if expected_tool is None:
        assert actual_calls == [], f"Expected no tool call, got {actual_calls}"
    else:
        assert len(actual_calls) == 1, f"Expected one tool call, got {actual_calls}"
        assert actual_calls[0].get("name") == expected_tool, f"Expected {expected_tool}, got {actual_calls[0].get('name')}"
        actual_args = actual_calls[0].get("arguments", {})
        for key, expected in case.get("expectedArguments", {}).items():
            assert actual_args.get(key) == expected, f"{key}: expected {expected!r}, got {actual_args.get(key)!r}"

    facts = reply.get("verifiedFacts", [])
    missing_numbers = numeric_values(case.get("expectedFacts", {})) - money_values(facts)
    assert not missing_numbers, f"Ground-truth figures missing from verified facts: {sorted(missing_numbers)}"
    expected_text = text_values(case.get("expectedFacts", {}))
    evidence_text = " ".join(
        [reply.get("answer", "")]
        + [str(item.get("label", "")) for item in facts]
    ).casefold()
    missing_text = {value for value in expected_text if value not in evidence_text}
    assert not missing_text, f"Expected categories or labels missing from the answer: {sorted(missing_text)}"

    output_numbers = money_values([{"value": reply.get("answer", "")}])
    unsupported_numbers = output_numbers - money_values(facts)
    assert not unsupported_numbers, f"Answer contains figures not present in verified facts: {sorted(unsupported_numbers)}"

    if case.get("mustExplainEstimateLimit"):
        lower_answer = reply.get("answer", "").casefold()
        assert any(word in lower_answer for word in ("recorded", "upcoming", "unrecorded", "estimate", "does not account")), "Purchase response must explain estimate limits."

    if case.get("mustAskTimeframe"):
        lower_answer = reply.get("answer", "").casefold()
        assert any(word in lower_answer for word in ("timeframe", "how many months", "by when", "when would")), "Savings response must ask for a timeframe."

    if case.get("mustNotWriteBeforeApproval"):
        assert reply.get("pendingAction", {}).get("type") == "budget_change", "Expected a reviewable budget draft."
        after_budget = budget_amount(case["expectedArguments"]["month"], case["expectedArguments"]["categoryName"])
        assert before_budget == after_budget, f"Draft changed a budget before approval: {before_budget} -> {after_budget}"

    return {
        "id": case["id"],
        "status": "passed",
        "tools": [call["name"] for call in actual_calls],
        "verified_fact_count": len(facts),
    }


def main():
    data = json.loads(GOLDEN_SET.read_text(encoding="utf-8"))
    results = []
    failures = []
    for case in data["cases"]:
        try:
            results.append(run_case(case))
        except Exception as error:  # Keep going so one failure does not hide the rest of the report.
            failures.append({"id": case["id"], "status": "failed", "error": str(error)})

    report = {
        "golden_set": data["name"],
        "total": len(data["cases"]),
        "passed": len(results),
        "failed": len(failures),
        "results": results + failures,
        "note": "DeepEval refusal judge runs separately with deepeval test run test_refusals.py.",
    }
    print(json.dumps(report, indent=2))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
