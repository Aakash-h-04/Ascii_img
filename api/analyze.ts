import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return res.status(500).json({
        error: "Gemini API key is not configured",
      });
    }

    const { base64Image } = req.body;

    if (!base64Image || typeof base64Image !== "string") {
      return res.status(400).json({
        error: "base64Image is required",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const cleanBase64 = base64Image.replace(
      /^data:image\/(png|jpeg|jpg);base64,/,
      ""
    );

    const prompt = `
      You are a futuristic cyberpunk security AI.
      Analyze this visual feed of a person or object.
      Provide a brief, robotic assessment of what you see.
      Determine a 'Threat Level' (e.g., LOW, MODERATE, CRITICAL, UNKNOWN).
      Extract key identifier tags.

      Respond in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description:
                "A robotic, 2-sentence analysis of the subject.",
            },
            threatLevel: {
              type: Type.STRING,
              description: "The calculated threat level.",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "List of 3-5 keywords identifying features.",
            },
          },
          required: ["description", "threatLevel", "tags"],
        },
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("No response from AI");
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini API Error:", error);

    return res.status(500).json({
      description:
        "ANALYSIS FAILED. UNABLE TO PROCESS VISUAL DATA. RETRY INITIATED.",
      threatLevel: "ERROR",
      tags: ["ERROR", "NO_DATA"],
    });
  }
}
