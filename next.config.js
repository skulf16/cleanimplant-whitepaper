/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erzeugt einen schlanken, eigenständigen Server-Build für Docker/Coolify
  output: "standalone",
  async redirects() {
    return [
      // Sprachen getauscht: Englisch ist jetzt Root, Deutsch unter /de
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/guideline", destination: "/guideline", permanent: true },
      { source: "/leitlinie", destination: "/de/leitlinie", permanent: true },
    ];
  },
};

module.exports = nextConfig;
