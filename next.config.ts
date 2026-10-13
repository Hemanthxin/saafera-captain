import type { NextConfig } from "next";

// The driver app talks to the Saafera web app's /api/driver/* routes. They are
// proxied through this origin so the browser never makes a cross-origin call
// (no CORS to configure) and the Saafera URL stays out of client code.
const SAAFERA_URL = process.env.SAAFERA_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/captain-api/:path*", destination: `${SAAFERA_URL}/api/driver/:path*` }];
  },
};

export default nextConfig;
