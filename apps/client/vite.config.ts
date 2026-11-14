import { helpUrlRedirectPlugin } from "../../scripts/help-url-redirects.mjs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import { helpEditorPlugin } from "../../scripts/help-editor-server.mjs";

const envPath = path.resolve(process.cwd(), "..", "..");

export default defineConfig(({ mode }) => {
  const {
    APP_URL,
    FILE_UPLOAD_SIZE_LIMIT,
    FILE_IMPORT_SIZE_LIMIT,
    DRAWIO_URL,
    CLOUD,
    SUBDOMAIN_HOST,
    COLLAB_URL,
    BILLING_TRIAL_DAYS,
    POSTHOG_HOST,
    POSTHOG_KEY,
    HELP_EDITOR_AUTH_ORIGIN,
    HELP_EDITOR_WORKSPACE_ID,
    AI_VECTOR_DRIVER,
    BETA_PUBLIC_SPACES,
    UNSPLASH_ACCESS_KEY,
  } = loadEnv(mode, envPath, "");

  return {
    envDir: envPath,
    define: {
      "process.env": {
        APP_URL,
        FILE_UPLOAD_SIZE_LIMIT,
        FILE_IMPORT_SIZE_LIMIT,
        DRAWIO_URL,
        CLOUD,
        SUBDOMAIN_HOST,
        COLLAB_URL,
        BILLING_TRIAL_DAYS,
        POSTHOG_HOST,
        POSTHOG_KEY,
        AI_VECTOR_DRIVER,
        BETA_PUBLIC_SPACES,
        UNSPLASH_ENABLED: UNSPLASH_ACCESS_KEY?.trim() ? "true" : undefined,
      },
      APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
      react(),
      helpUrlRedirectPlugin(envPath),
      helpEditorPlugin(envPath, {
        origin: HELP_EDITOR_AUTH_ORIGIN,
        workspaceId: HELP_EDITOR_WORKSPACE_ID,
      }),
    ],
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [
              {
                name: "vendor-mantine",
                test: /[\\/]node_modules[\\/]@mantine[\\/]/,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/.helpcenter-editor/**",
          "**/docs/helpcenter/locales/**",
          "**/docs/helpcenter/release-archive/**",
          "**/docs/helpcenter/structure.json",
          "**/docs/helpcenter/source-snapshot.json",
        ],
      },
      proxy: {
        "/api": {
          target: APP_URL,
          changeOrigin: false,
        },
        "/socket.io": {
          target: APP_URL,
          ws: true,
          rewriteWsOrigin: true,
        },
        "/collab": {
          target: APP_URL,
          ws: true,
          rewriteWsOrigin: true,
        },
      },
    },
  };
});
