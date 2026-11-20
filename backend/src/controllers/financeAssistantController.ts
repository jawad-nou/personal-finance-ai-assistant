import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FinanceAssistantError, approveBudgetChange } from '../services/financeAssistantDataService';
import { answerFinanceQuestion } from '../services/financeAssistantService';

export const sendAssistantMessage = async (req: AuthRequest, res: Response) => {
  const question = req.body?.question;
  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ message: 'Enter a question for the assistant.' });
  }
  if (question.length > 1200) {
    return res.status(400).json({ message: 'Keep the question under 1,200 characters.' });
  }

  try {
    const reply = await answerFinanceQuestion(req.userId!, question.trim());
    return res.json(reply);
  } catch (error) {
    const status = error instanceof FinanceAssistantError ? error.statusCode : 500;
    const message = error instanceof FinanceAssistantError ? error.message : 'The assistant could not complete that request.';
    return res.status(status).json({ message });
  }
};

export const approveAssistantBudget = async (req: AuthRequest, res: Response) => {
  const approvalToken = req.body?.approvalToken;
  if (typeof approvalToken !== 'string' || !approvalToken || approvalToken.length > 4096) {
    return res.status(400).json({ message: 'A valid budget approval is required.' });
  }

  try {
    const result = await approveBudgetChange(req.userId!, approvalToken);
    return res.json(result);
  } catch (error) {
    const status = error instanceof FinanceAssistantError ? error.statusCode : 500;
    const message = error instanceof FinanceAssistantError ? error.message : 'The budget could not be updated.';
    return res.status(status).json({ message });
  }
};
