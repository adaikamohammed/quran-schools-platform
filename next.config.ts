import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // تعطيل SW في وضع التطوير لتسهيل الاختبار
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
