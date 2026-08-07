import type { Condition } from '@/types';

// Load the API Key from Vite environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function analyzeSymptomsWithGemini(
  symptoms: string,
  photoUrl: string | null
): Promise<Condition> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `You are an emergency first-aid assistant.
Analyze the provided symptoms and the uploaded injury image (if available).
State that the assessment is based only on the image and symptoms provided.
Do not provide a definitive medical diagnosis.

Provide the response in the following JSON format:
{
  "id": "slug-name",
  "name": "Condition Name",
  "urgency": "critical" | "urgent" | "moderate" | "lower",
  "confidence": number, // an integer from 1 to 100
  "description": "Short explanation stating that this is an AI triage assessment based only on the image/symptoms provided and is not a definitive medical diagnosis.",
  "recommendedActions": ["Action 1", "Action 2", "Action 3", "Action 4"],
  "firstAid": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "warnings": ["Warning 1", "Warning 2"]
}

Symptoms described: "${symptoms}"`;

  const contents: any[] = [];
  const parts: any[] = [{ text: promptText }];

  // If a base64 photo is provided, extract its components and add as inlineData
  if (photoUrl) {
    const match = photoUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const data = match[2];
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }
  }

  contents.push({ parts });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Received empty response from Gemini API');
  }

  // Clean markdown format wrappers if model includes them despite responseMimeType
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanedText);

  // Validate fields and cast to Condition
  return {
    id: parsed.id || 'ai-triage-case',
    name: parsed.name || 'AI Assessed Condition',
    urgency: ['critical', 'urgent', 'moderate', 'lower'].includes(parsed.urgency)
      ? parsed.urgency
      : 'moderate',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
    description: parsed.description || 'Initial AI triage assessment based on symptoms.',
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    firstAid: Array.isArray(parsed.firstAid) ? parsed.firstAid : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  };
}
