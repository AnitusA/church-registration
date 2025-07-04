/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_singleFetch: true,
    v3_lazyRouteDiscovery: true,
  },
};

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = process.env;

module.exports = {
  serverBuildTarget: "node-cjs",
  server: "./server.js",
  serverDependenciesToBundle: [
    /^@supabase.*/,
  ],
  env: {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  },
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm", // Important for Vite compatibility
};
