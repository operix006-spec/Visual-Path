import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const instructions = "Classify this image into 'جيم ستايل' or 'cinematic style'";
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      classification: { 
        type: Type.STRING,
        enum: ['جيم ستايل', 'cinematic style']
      },
      confidence: { type: Type.NUMBER },
    },
    required: ['classification', 'confidence'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [instructions, "This is a prompt simulating an image..."],
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.1,
      },
    });
    console.log("Success:");
    console.log(response.text);
  } catch (e) {
    console.log("Error:");
    console.log(String(e));
  }
}

main();
