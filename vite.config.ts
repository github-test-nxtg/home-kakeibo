import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" にすると GitHub Pages などのサブパス公開でも動きます
export default defineConfig({ plugins: [react()], base: "./" });
