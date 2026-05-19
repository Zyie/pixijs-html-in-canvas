import { defineConfig } from "vite";
import { analyzer } from 'vite-bundle-analyzer' 

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    open: true,
  },
  plugins: [analyzer()],
});
