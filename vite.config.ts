import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), {
      name: 'development-csp', apply: 'serve',
      // Vite's development-only React refresh preamble needs inline script execution.
      // Production retains the restrictive policy from index.html.
      transformIndexHtml: html => html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, ''),
    }],
    base: env.VITE_BASE_PATH || '/', build: { sourcemap: false },
    resolve: { dedupe: ['react', 'react-dom', 'three'] },
    // Prebundle the 3D addons with the renderer so development refreshes share one React/Three graph.
    optimizeDeps: { include: ['react', 'react-dom/client', '@react-three/fiber', 'three', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/environments/RoomEnvironment.js'] },
    server: { strictPort: true, port: 5173 },
  };
});
