import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Spring API 는 별도 온프레미스 서버에 배포되므로 런타임 env 로 base URL 을 주입한다.
  // 클라이언트에서 직접 호출하려면 NEXT_PUBLIC_API_BASE_URL 을 사용.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  },
};

export default nextConfig;
