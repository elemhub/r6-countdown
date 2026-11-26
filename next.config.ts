import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

// Static export: the site is plain HTML/JS, deployable on Cloudflare Pages (or any static host).
// Server-rendered texts refresh on each rebuild (scheduled in .github/workflows/scheduled-rebuild.yml);
// the countdown itself is computed live in the browser.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
