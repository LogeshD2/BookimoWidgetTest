import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],

  define: {
    'process.env': {}, // 👈 FIX ABSOLU
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "AppointmentWidget",
      fileName: () => "widget.iife.js",
      formats: ["iife"],
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
    minify: true,
    emptyOutDir: true,
  },
});
