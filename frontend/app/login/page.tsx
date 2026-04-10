"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken } = res.data;
            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
                router.push("/");
            }
        } catch (err: any) {
            alert("이메일 또는 비밀번호를 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    // [수정] 배포 환경을 고려하여 .env.local의 API 주소를 사용하도록 수정
    const handleGoogleLogin = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            {/* 상단 네비게이션 바 (웹사이트 느낌) */}
            <nav className="w-full py-6 px-10 bg-white/50 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center fixed top-0 z-50">
                <div className="font-black text-2xl tracking-tighter">
                    <span className="text-dn-orange">Dev</span>Near
                </div>
            </nav>
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">

                {/* 좌측: 온보딩 감성 문구 */}
                <div className="hidden md:block space-y-6">
                    <h1 className="text-5xl font-extrabold leading-tight text-zinc-900">
                        DevNear에 다시 <br />
                        <span className="text-dn-purple">접속</span>하여 <br />
                        <span className="text-dn-orange">우산</span>을 펼치세요.
                    </h1>
                    <p className="text-zinc-500 text-lg">
                        DevNear는 개발자의 능력을 <br />
                        가장 타당하게 증명하는 공간입니다.
                    </p>
                </div>

                {/* 우측: 로그인 카드 */}
                <div className="bg-white/80 backdrop-blur-sm p-12 shadow-2xl rounded-[2.5rem] border border-white">
                    <h2 className="text-2xl font-bold mb-2 text-zinc-800">로그인</h2>
                    <p className="text-zinc-400 mb-8 text-sm font-medium">활동에 필요한 계정 정보를 입력해주세요.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 ml-1">이메일</label>
                            {/* 제어 컴포넌트(value 연결)가 이미 적용되어 있습니다 */}
                            <input
                                type="email"
                                placeholder="이메일을 입력해주세요"
                                className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 ml-1">비밀번호</label>
                            <input
                                type="password"
                                placeholder="비밀번호를 입력해주세요"
                                className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-bold hover:bg-dn-purple transition-all shadow-lg active:scale-95 disabled:bg-zinc-300 mt-4"
                        >
                            {loading ? "접속 중..." : "시작하기"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400 font-bold">OR</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border border-zinc-100 p-4 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-700 mb-6 shadow-sm"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                        Google 계정으로 로그인
                    </button>

                    <p className="text-center text-sm text-zinc-400 font-medium">
                        아직 계정이 없으신가요? <Link href="/signup" className="text-dn-purple font-bold hover:underline">회원가입</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}