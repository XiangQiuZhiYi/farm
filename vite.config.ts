import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    // Use relative base path for Electron production build
    base: mode === "production" ? "./" : "/",
    plugins: [
        react(),
        codeInspectorPlugin({
            bundler: "vite",
        }),
    ],
}));
