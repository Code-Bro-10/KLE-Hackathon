import type { Condition, VoiceHealthReport } from '@/types';

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

export async function analyzeVoiceSymptomsWithGemini(
  transcript: string,
  lang: string
): Promise<VoiceHealthReport> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `You are ResQ AI, an emergency medical assistant.

Analyze the patient's symptoms described in the transcript.
The transcript was recognized in language: ${lang}.

Never provide a definitive medical diagnosis.

Return ONLY JSON.

Return:
{
  "summary": "Short summary of the patient's symptoms.",
  "possible_conditions": [
    {
      "name": "Condition Name",
      "probability": "Probability percentage (e.g. 85%)"
    }
  ],
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "recommended_specialist": "Name of recommended specialist department",
  "first_aid": [
    "First aid action 1",
    "First aid action 2",
    "First aid action 3"
  ],
  "ambulance_required": boolean,
  "reason": "Brief reason explaining the severity and if ambulance is needed.",
  "next_steps": [
    "Next step 1",
    "Next step 2",
    "Next step 3"
  ],
  "disclaimer": "This is not a medical diagnosis."
}

Transcript: "${transcript}"`;

  const contents = [
    {
      parts: [{ text: promptText }]
    }
  ];

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

  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanedText);

  // Validate fields and cast to VoiceHealthReport
  return {
    summary: parsed.summary || 'Summary not available.',
    possible_conditions: Array.isArray(parsed.possible_conditions) ? parsed.possible_conditions : [],
    severity: ['Low', 'Moderate', 'High', 'Critical'].includes(parsed.severity)
      ? parsed.severity
      : 'Moderate',
    recommended_specialist: parsed.recommended_specialist || 'General Physician',
    first_aid: Array.isArray(parsed.first_aid) ? parsed.first_aid : [],
    ambulance_required: typeof parsed.ambulance_required === 'boolean' ? parsed.ambulance_required : false,
    reason: parsed.reason || 'No specific reasons provided.',
    next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
    disclaimer: parsed.disclaimer || 'This is not a medical diagnosis.',
  };
}

export async function suggestEquipmentWithGemini(
  transcript: string,
  photoUrl: string | null
): Promise<{ suggestion: string; items: string[]; rationale: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `You are ResQ AI, an emergency medical assistant.
Analyze the provided medical transcript, prescription notes, or report image.
Determine if the patient requires any medical equipment rentals (e.g. Wheelchair, Oxygen Concentrator, Oxygen Cylinder, Hospital Bed, Walker, Crutches, CPAP Machine).

Suggest specific equipment classes from the following list ONLY:
["Wheelchair", "Concentrator", "Cylinder", "Bed", "Walker", "Crutches", "CPAP"]

Never claim to provide a definitive medical prescription.
Return ONLY JSON.

Return:
{
  "suggestion": "Brief summary suggestion (e.g. 'Walker recommended for rehabilitation support')",
  "items": ["Walker", "Crutches"],
  "rationale": "Clinical explanation of why this equipment is suggested based on the symptoms/injuries described."
}

Transcript/Prescription described: "${transcript}"`;

  const contents: any[] = [];
  const parts: any[] = [{ text: promptText }];

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

  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanedText);
  return {
    suggestion: parsed.suggestion || 'Consult your physician for equipment suggestions.',
    items: Array.isArray(parsed.items) ? parsed.items : [],
    rationale: parsed.rationale || 'Assessment completed based on symptoms notes.',
  };
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `Translate the following text to the language: "${targetLanguage}".
Only return the translated text itself. Do not write any explanations, notes, metadata, or markdown wrappers.

Text to translate:
"${text}"`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const resData = await response.json();
  const translated = resData.candidates?.[0]?.content?.parts?.[0]?.text;

  return translated ? translated.trim() : text;
}
