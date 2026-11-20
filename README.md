# Personal Finance Manager with AI Assistant

A full-stack personal finance app for tracking expenses, income, budgets, and savings goals. Its AI assistant lets a signed-in user ask questions about their own records, compare months, estimate a purchase against recorded cash flow, plan contributions to a savings goal, and prepare a budget change for approval.

## What it does

- Provides account registration and sign-in, a dashboard, expense and income tracking, budgets, reports, analytics, calendar, notifications, profile, settings, and savings goals.
- Adds a natural-language assistant at `/assistant`.
- Offers the model three fixed tools: `get_finance_snapshot`, `draft_savings_plan`, and `propose_budget_change`.
- Runs parameterized MySQL queries in the backend, scoped to the authenticated user's ID. The model does not receive SQL access or choose a user ID.
- Keeps budget changes as signed, expiring drafts. The user must separately approve a draft; the backend checks ownership and whether the budget changed before applying it.
- Includes a synthetic demo-data seeder, a machine-readable golden set, and an optional DeepEval refusal suite.

The assistant's finance answers come from the signed-in account's database records. There is no retrieval-augmented generation (RAG) corpus or vector database in this implementation. Purchase checks compare an amount with recorded monthly net cash flow only; they do not account for future bills, debt, or transactions absent from the app.

## Stack

- Frontend: React 19, TypeScript, Create React App, React Router, Tailwind CSS, Chart.js, and Recharts.
- Backend: Node.js, Express, TypeScript, JWT authentication, and `mysql2`.
- Database: MySQL.
- AI: an OpenAI-compatible Chat Completions endpoint called with Node's built-in `fetch`; the example configuration points to Google's Gemini endpoint. Tool calls are processed by application code.
- Evaluation: Python golden-set checks and an optional DeepEval G-Eval refusal judge.

## Requirements

- Node.js and npm.
- MySQL and the MySQL command-line client. `database.sql` creates a fresh `budget_app` schema; it is not a migration for an existing database.
- A provider API key for assistant requests. The rest of the app can be started without the AI provider configured, but the assistant will return a configuration error.

## Setup and run

Commands below use PowerShell from the project root.

1. For a fresh local database, import the schema from Command Prompt:

   ```cmd
   mysql -u root -p < database.sql
   ```

   If your MySQL user, host, or port differs, adjust the command and the matching backend settings below. Review `database.sql` before using it with a database that already contains data.

2. Create the backend environment file and set its values:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   notepad backend/.env
   ```

   Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for your MySQL instance. Set `JWT_SECRET` to a long random value. To use the assistant, set `AI_API_KEY` to your provider key and configure `AI_BASE_URL` and `AI_MODEL` for a tool-calling model supported by that endpoint. Keep real credentials in local `.env` files only.

3. Start the backend in one terminal:

   ```powershell
   Set-Location backend
   npm.cmd ci
   npm.cmd run dev
   ```

   The API listens on `http://localhost:5000` by default.

4. In a second terminal, start the frontend:

   ```powershell
   Set-Location frontend
   npm.cmd ci
   npm.cmd start
   ```

   The frontend opens at `http://localhost:3000`. It uses `http://localhost:5000/api` by default. To change that, copy `frontend/.env.example` to `frontend/.env` and set `REACT_APP_API_URL` before starting the frontend.

5. Register an account, add finance records, and open **Money Assistant** from the navigation. Without the seeded fixture, answers reflect only records you add to your account.

### Synthetic assistant demo

With MySQL and the backend environment configured, run this in the backend directory:

```powershell
npm.cmd run seed:assistant-demo
```

The seeder creates or refreshes the reserved `case2-demo@example.test` account with synthetic September-November 2026 records. On first creation it prints a randomly generated demo password, and it prints a short-lived evaluation JWT. Treat both as credentials and do not commit or share them. Do not use the reserved email for a real account.

## Example

Using the seeded synthetic account, ask:

> Why did I overspend in October 2026?

Expected verified figures include **$2,500 income**, **$2,300 expenses**, **$200 net cash flow**, and **Food spending of $650 against a $500 budget**, an overrun of **$150**. The assistant's natural-language wording can vary; the numeric facts are calculated by the backend.

## Build and evaluation

From the project root, run the backend build in one terminal:

```powershell
Set-Location backend
npm.cmd run build
```

In a second terminal, run the frontend build and its configured test runner:

```powershell
Set-Location frontend
npm.cmd run build
npm.cmd test -- --watchAll=false
```

The backend package has a TypeScript build script but no unit-test script. The frontend test command uses Create React App's Jest runner. The assistant evaluation scripts are integration checks and need a running backend, seeded synthetic account, and valid `FINANCE_ASSISTANT_TOKEN`:

```powershell
$env:FINANCE_ASSISTANT_TOKEN = '<short-lived JWT printed by the demo seeder>'
python backend/evaluation/run_golden_set.py
```

The refusal suite additionally needs the `deepeval` dependency and its judge-model configuration:

```powershell
python -m pip install -r backend/evaluation/requirements.txt
deepeval test run backend/evaluation/test_refusals.py
```

Both evaluation paths make live assistant requests and therefore need a working provider API key. The budget-draft case also checks that the draft does not write before approval.

## Attribution, project origin, and license

The implementation notes associated with this project credit the fixed-workflow, bounded-tool approach to [deskhand-workshop](https://github.com/hasankanaan26/deskhand-workshop). They also describe the six core database entities as based on a senior-project report; that report is not included here. The optional budgeting-guidance RAG idea mentioned in the project notes is not implemented.

Available local history contains only the nested frontend's Create React App initialization commit. There is no root or backend Git history and no configured remote, so this workspace alone cannot establish which application files were authored by the student versus supplied by SE Factory or an instructor. No repository-level license file was present, and none has been invented for this export. Confirm publication rights for any course-provided starter materials, instructor material, or report-derived content before making the repository public. Each dependency's own license terms still apply.
