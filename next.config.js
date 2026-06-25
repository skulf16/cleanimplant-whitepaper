/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erzeugt einen schlanken, eigenständigen Server-Build für Docker/Coolify
  output: "standalone",
};

module.exports = nextConfig;
