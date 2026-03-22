import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

const saveImagesPlugin = () => ({
  name: 'save-images',
  configureServer(server: any) {
    server.middlewares.use('/api/save-images', (req: any, res: any) => {
      if (req.method !== 'POST') return;
      let body = '';
      req.on('data', (chunk: any) => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (!fs.existsSync('public/services')) {
            fs.mkdirSync('public/services', { recursive: true });
          }
          for (const [id, base64] of Object.entries(data)) {
            const base64Data = (base64 as string).split(',')[1];
            if (base64Data) {
              const buffer = Buffer.from(base64Data, 'base64');
              fs.writeFileSync(`public/services/service-${id}.png`, buffer);
            }
          }
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    });
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  console.log("VITE CONFIG API KEY:", !!env.GEMINI_API_KEY);
  return {
    plugins: [react(), tailwindcss(), saveImagesPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
