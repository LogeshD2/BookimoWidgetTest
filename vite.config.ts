import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  define: {
    "process.env": {},
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 👈 FIX
    },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "AppointmentWidget",
      formats: ["iife"],
      fileName: () => "widget.iife.js",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
});
