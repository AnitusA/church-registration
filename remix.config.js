/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_singleFetch: true,
    v3_lazyRouteDiscovery: true,
  },
  env: {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  },
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm", // Important for Vite compatibility
};
