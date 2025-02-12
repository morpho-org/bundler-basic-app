import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    include: [
      "@morpho-org/blue-sdk",
      "@morpho-org/bundler-sdk-viem",
      "@morpho-org/simulation-sdk",
      "@morpho-org/morpho-test",
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ["@morpho-org/test"],
    },
  },
  resolve: {
    alias: {
      "@morpho-org/test": "@morpho-org/morpho-test",
    },
  },
});
