import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
// It automatically picks up the GEMINI_API_KEY from the environment
let aiClient: GoogleGenAI | null = null;

export const generateExplainabilityReport = async (recommendationsData: any) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  const prompt = `You are an expert financial analyst for the OptiFi platform. Review the following budget optimization recommendations and explain the reasoning behind the changes for each department.
  Keep it extremely concise and professional (1-2 sentences per department).
  Return ONLY a raw JSON object where the keys are the exact department names and the values are your explanation strings. Do not include markdown formatting.

  Recommendations Data:
  ${JSON.stringify(recommendationsData, null, 2)}`;

  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
  ];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      if (i > 0) {
        console.log(`Waiting 3 seconds before retrying with ${model}...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      const response = await aiClient.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (!response.text) {
        throw new Error('Received empty response from Gemini API');
      }

      return JSON.parse(response.text);
    } catch (error: any) {
      // Silently log fallback for debugging, but don't alarm the user if a fallback succeeds
      console.log(`[OptiFi AI] Model ${model} unavailable, trying next...`);
      lastError = error;
    }
  }

  throw lastError || new Error('All models failed to generate content.');
};
