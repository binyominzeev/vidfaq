import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    cors: {
      origin: (origin, callback) => {
        try {
          const hostname = origin ? new URL(origin).hostname : '';
          if (!origin || /([a-zA-Z0-9-]+\.)*vidfaq\.com$/.test(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"), false);
          }
        } catch {
          callback(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
    },
    allowedHosts: [".vidfaq.com", "localhost"],
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
