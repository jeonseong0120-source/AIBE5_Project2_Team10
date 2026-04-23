// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import ChatWidget from "@/components/chat/ChatWidget";
// import Script from "next/script"; // ❌ 제거
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DevNear | 재능 매칭 기지",
    description: "최적의 요원을 자동으로 소집하는 지능형 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <NotificationProvider>
                    {children}
                    <ChatWidget />
                </NotificationProvider>
            </body>
        </html>
    );
}