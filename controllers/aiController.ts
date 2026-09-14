import { Request, Response } from 'express';
import { generateExplainabilityReport } from '../services/aiService';

export const explainOptimization = async (req: Request, res: Response) => {
  try {
    const { recommendations } = req.body;
    
    if (!recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ message: 'Invalid recommendations data provided.' });
    }

    const explanations = await generateExplainabilityReport(recommendations);
    
    res.status(200).json(explanations);
  } catch (error: any) {
    console.error('AI Explanation Error:', error);
    res.status(500).json({ 
      message: 'Failed to generate AI explanations. Ensure GEMINI_API_KEY is configured.',
      error: error.message 
    });
  }
};
