import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/:path*", // 프론트에서 /api/로 시작하는 모든 요청은
                destination: "http://localhost:8080/api/:path*", // 실제로는 백엔드 8080번으로 보낸다!
            },
        ];
    },
};

export default nextConfig;