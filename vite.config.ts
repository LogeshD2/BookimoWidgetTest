import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,  
    proxy: {
      "/auth": "http://localhost:3000"
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget.tsx'),
      name: 'AppointmentWidget',
      fileName: 'widget',
      formats: ['iife'] // Format pour le browser
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.[ext]',
        inlineDynamicImports: true,
      }
    },
    cssCodeSplit: false,
  }
});