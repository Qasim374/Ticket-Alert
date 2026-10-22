/** @type {import('next').NextConfig} */
const nextConfig = {
  // instrumentation.js runs once when the server boots — we use it to start
  // the background goal-checker. (Stable in Next 14, so no flag needed.)
};

module.exports = nextConfig;
