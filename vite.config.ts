import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), {
      name: 'development-csp', apply: 'serve',
      // Vite's development-only React refresh preamble needs inline script execution.
      // Production retains the restrictive policy from index.html.
      transformIndexHtml: html => html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, ''),
      configureServer(server) {
        server.middlewares.use('/__local-media', async (req, res) => {
          const match = /^\/gallery\/(thumb|full)\/(\d{2})\.webp$/.exec(req.url || '');
          if (!match || !['GET', 'HEAD'].includes(req.method || '')) { res.statusCode = 404; res.end(); return; }
          try { const data = await readFile(resolve('private-media/gallery', match[1], `${match[2]}.webp`)); res.setHeader('Content-Type', 'image/webp'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(req.method === 'HEAD' ? undefined : data); }
          catch { res.statusCode = 404; res.end(); }
        });
      },
    }],
    base: env.VITE_BASE_PATH || '/', build: { sourcemap: false },
    resolve: { dedupe: ['react', 'react-dom', 'three'] },
    // Prebundle the 3D addons with the renderer so development refreshes share one React/Three graph.
    optimizeDeps: { include: ['react', 'react-dom/client', '@react-three/fiber', 'three', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/environments/RoomEnvironment.js'] },
    server: { strictPort: true, port: 5173 },
  };
});
