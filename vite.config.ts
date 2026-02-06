import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Fix pour process.env undefined dans certaines libs
  define: {
    "process.env": {},
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // permet d'utiliser @/xxx
    },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "AppointmentWidget",
      formats: ["iife"],           // format IIFE pour embed dans HTML
      fileName: () => "widget.iife.js", // nom du fichier JS final
    },
    rollupOptions: {
      external: ["react", "react-dom"], // React doit être chargé dans le HTML
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        inlineDynamicImports: true, // pour éviter les chunks séparés
      },
    },

    // -------------------
    // Gestion du CSS
    // -------------------
    cssCodeSplit: false, // ✅ CHANGEMENT ICI : inclure le CSS dans le JS
  },

  server: {
    port: 5173,
    host: "::",
    proxy: {
      "/auth": "http://localhost:3000", // si besoin de proxy API
    },
  },
});