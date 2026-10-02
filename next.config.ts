import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server serve HMR and overlay assets when opened via the LAN IP.
  allowedDevOrigins: ["192.168.10.11"],
};

export default nextConfig;
