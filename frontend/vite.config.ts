import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";

export default defineConfig({
  base: "/",
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    tsconfigPaths(),
    svgr(),
    checker({
      overlay: false,
      typescript: true,
      eslint: {
        lintCommand: "eslint './src/**/*.{js,jsx,ts,tsx}'",
        useFlatConfig: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  },
  server: {
    open: true,
    host: "0.0.0.0",
    port: 4444,
  },
  preview: {
    host: "0.0.0.0",
    port: 4444,
  },
  build: {
    outDir: "build",
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  }
});
