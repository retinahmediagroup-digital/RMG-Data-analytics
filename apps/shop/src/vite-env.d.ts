/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Stopgap access code for the client-side PasswordGate - see its own doc comment for limitations. */
  readonly VITE_SHOP_ACCESS_CODE?: string;
}
