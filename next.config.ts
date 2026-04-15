import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // تعطيل SW في وضع التطوير لتسهيل الاختبار
});

const nextConfig: NextConfig = {
  turbopack: {}, // Required in Next.js 16+ to acknowledge Turbopack alongside webpack configs
};

export default withSerwist(nextConfig);
