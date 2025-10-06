/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone mode to avoid symlink issues
  distDir: '.next',
  // Ensure proper build output
};

export default nextConfig;
