import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // แนะนำให้ใส่ไว้หากมีการใช้งาน <Image /> ของ Next.js เพราะ GitHub Pages ไม่รองรับ Image Optimization
  },
};

export default nextConfig;