import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    build: {
        outDir: "./build/client",
        rollupOptions: {
            onwarn(warning, warn) {
                // Ignore eval warnings from pdfjs-dist
                if (warning.code === 'EVAL' && warning.id?.includes('pdfjs-dist')) {
                    return;
                }
                warn(warning);
            }
        }
    },
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths()
    ]
});