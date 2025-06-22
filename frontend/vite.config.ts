/// <reference types="node" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Ensure required environment variables are present
  const requiredEnvVars = ['VITE_KINDE_CLIENT_ID', 'VITE_KINDE_DOMAIN'];
  const missingEnvVars = requiredEnvVars.filter(key => !env[key]);
  
  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    console.error('Current environment:', env);
  }

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // This will transform your SVG to a React component
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    build: {
      // Output to dist directory
      outDir: "dist",
      // Generate manifest for Django to use
      manifest: true,
      rollupOptions: {
        output: {
          // Ensure assets are in the assets directory
          assetFileNames: 'assets/[name].[ext]',
          chunkFileNames: 'assets/[name].js',
          entryFileNames: 'assets/[name].js',
        },
      },
    },
    // Set base URL based on environment
    base: mode === 'production' ? '/static/' : '/',
    // Define environment variables
    define: {
      'import.meta.env.VITE_KINDE_CLIENT_ID': JSON.stringify(env.VITE_KINDE_CLIENT_ID),
      'import.meta.env.VITE_KINDE_DOMAIN': JSON.stringify(env.VITE_KINDE_DOMAIN),
    },
  };
});
