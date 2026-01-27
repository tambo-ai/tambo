export const tamboApiKey = import.meta.env.VITE_TAMBO_API_KEY;

if (!tamboApiKey) {
  throw new Error(
    "Missing VITE_TAMBO_API_KEY. Copy .env.example to .env and add your tambo API key."
  );
}
