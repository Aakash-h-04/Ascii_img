import { AnalysisResult } from '../types';

export const analyzeImage = async (
  base64Image: string
): Promise<AnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Analysis request failed');
    }

    return data as AnalysisResult;
  } catch (error) {
    console.error('Gemini API Error:', error);

    return {
      description:
        'ANALYSIS FAILED. UNABLE TO PROCESS VISUAL DATA. RETRY INITIATED.',
      threatLevel: 'ERROR',
      tags: ['ERROR', 'NO_DATA'],
    };
  }
};
