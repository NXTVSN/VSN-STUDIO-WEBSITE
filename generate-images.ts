import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { loadEnv } from 'vite';

// Load environment variables using Vite's helper
const env = loadEnv('development', process.cwd(), '');
const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const services = [
  {
    id: '01',
    name: 'Concept Design',
    prompt: 'A minimalist architectural concept design sketch, clean lines, modern residential building, blueprint style, high contrast, professional architectural visualization.'
  },
  {
    id: '02',
    name: 'Space Planning',
    prompt: 'Top-down view of a modern open-concept floor plan, architectural layout, clean minimal lines, monochrome with subtle shading, professional space planning.'
  },
  {
    id: '03',
    name: 'Architectural Visualization',
    prompt: 'Photorealistic 3D architectural rendering of a modern concrete and glass home exterior at twilight, warm interior lighting, hyper-realistic, high-end real estate.'
  },
  {
    id: '04',
    name: 'Architectural Drawings',
    prompt: 'Detailed architectural elevation drawing of a modern commercial building, technical lines, dimension lines, clean white background, professional drafting.'
  },
  {
    id: '05',
    name: 'Presentation Packages',
    prompt: 'A beautifully arranged architectural presentation board, material samples, concrete, wood, fabric swatches, and small architectural sketches, top-down flatlay, soft lighting.'
  }
];

async function generate() {
  const publicDir = path.join(process.cwd(), 'public', 'services');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  for (const service of services) {
    console.log(`Generating image for ${service.name}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: service.prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "4:3"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const buffer = Buffer.from(base64Data, 'base64');
          const filePath = path.join(publicDir, `service-${service.id}.png`);
          fs.writeFileSync(filePath, buffer);
          console.log(`Saved ${filePath}`);
        }
      }
    } catch (e) {
      console.error(`Failed for ${service.name}:`, e);
    }
  }
}

generate();
