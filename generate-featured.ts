import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function generateFeaturedImage() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A photorealistic aerial view of a modern circular concrete architectural structure built into a lush, green jungle valley. The ring-shaped building has warm interior lighting glowing through large glass windows. A small river runs through the center of the circular courtyard, surrounded by dense tropical trees and foliage. Cinematic, architectural photography, highly detailed, moody lighting.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(process.cwd(), 'public', 'featured-project.png');
        fs.writeFileSync(filePath, buffer);
        console.log('Successfully generated and saved featured-project.png');
        return;
      }
    }
    console.log('No image data found in response');
  } catch (error) {
    console.error('Error generating image:', error);
  }
}

generateFeaturedImage();
