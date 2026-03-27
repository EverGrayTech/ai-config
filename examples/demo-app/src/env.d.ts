/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_GATEWAY_BASE_URL?: string;
  readonly VITE_AI_GATEWAY_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
