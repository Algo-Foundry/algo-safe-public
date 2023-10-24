/** @type {import('next').NextConfig} */

const allowedURLs = [
  "https://ssl.gstatic.com",
  "https://*.algoexplorerapi.io",
  "https://testnet.algoexplorer.io",
  "https://algoexplorer.io",
  "https://*.purestake.io",
  "https://mainnet.algorand.producc.xyz:8080",
  "https://mainnet.algorand.producc.xyz:8980",
  "https://api.nf.domains",
  "https://api.testnet.nf.domains",
  "https://testnet-api.algonode.network",
  "https://testnet-idx.algonode.network",
  "http://mainnet-api.algonode.network",
  "https://mainnet-idx.algonode.network",
  "https://www.google-analytics.com/",
  "https://*.hotjar.com",
  "https://*.hotjar.io",
  "wss://*.hotjar.com",
  "https://discord.com/api/webhooks/",
  "https://*.perawallet.app/",
  "https://*.defly.app/",
  "https://s3.amazonaws.com/",
  "https://cloudflare-ipfs.com/",
  "https://*.walletconnect.com",
  "https://*.mypinata.cloud/",
];

const ContentSecurityPolicy = `
  default-src 'self' data: blob: ws: wss: gap: ${allowedURLs.join(" ")};
  script-src 'self' 'unsafe-eval' https://www.googletagmanager.com https://*.hotjar.com 'unsafe-inline';
  img-src * data: https://*.hotjar.com;
  style-src 'self' https://fonts.googleapis.com 'unsafe-inline' https://*.hotjar.com 'unsafe-inline';
  font-src 'self' https://fonts.gstatic.com https://*.hotjar.com;
  frame-src 'self' https://verify.walletconnect.org https://*.walletconnect.com https://*.hotjar.com https://*.perawallet.app/ https://*.defly.app/;
`;

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
];

const nextConfig = {
  reactStrictMode: false,

  // set false to solve tanstack table error
  swcMinify: false,
  sassOptions: {
    additionalData: `@import "styles/variables.scss";`,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  output: "standalone",
};

module.exports = nextConfig;

// Injected content via Sentry wizard below
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    org: "algofoundry",
    project: "javascript-nextjs",

    // suppress the nextjs warning
    api: {
      externalResolver: true,
    },
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
