import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a standalone server so the Docker `runner` stage can `node server.js`.
  output: "standalone",

  // When `API_URL` is unset at build time, `lib/api.ts` avoids throwing in
  // production so static generation succeeds; containers set `API_URL` at runtime.

  // In a monorepo, tell Next where the workspace root is so file tracing
  // picks up hoisted workspace packages (e.g. @the-record/shared-types).
  outputFileTracingRoot: path.join(__dirname, "..", ".."),

  reactStrictMode: true,

  // Compile raw TS sources from workspace packages in the monorepo.
  transpilePackages: ["@the-record/shared-types"],

  // Allowed remote image origins. `remotePatterns` is the modern replacement
  // for the deprecated `images.domains` option.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "therecord.co.za",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
