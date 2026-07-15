/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Next.js dev mode needs 'unsafe-eval' for HMR/fast refresh; keep the
// production CSP strict and only relax it in development.
const csp = [
  "default-src 'self'",
  `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone output is only used for the Docker production image (see
  // Dockerfile, which sets DOCKER_BUILD=1). Locally, `npm run build` +
  // `npm start` works normally without it.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
