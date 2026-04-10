"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import Link from "next/link";

export default function SignupPage() {
    const [formData, setFormData] = useState({
        email: "", password: "", name: "", nickname: "", role: "CLIENT",
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/signup", formData);
            alert("회원가입이 완료되었습니다!");
            router.push("/login");
        } catch (err: any) {
            alert("입력 정보를 다시 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-white font-sans text-zinc-900">

            {/* [배경 레이어 1] 설계도 그리드 */}
            <div className="absolute inset-0 z-0 opacity-[0.4]"
                 style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            {/* [배경 레이어 2] 메쉬 글로우 */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#7A4FFF] opacity-[0.08] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#FF7D00] opacity-[0.08] blur-[120px] rounded-full"></div>

            {/* [배경 레이어 3] 코드 데코레이션 (마스터 요청으로 선명도 0.25 상향) */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none opacity-[0.25] font-mono text-[11px] md:text-[14px] p-10 leading-relaxed">
                <div className="absolute top-[15%] left-[5%] rotate-[-3deg] text-[#FF7D00]">
                    {`@RestController\npublic class AuthController {\n  @PostMapping("/signup")\n  public ResponseEntity<?> signup() { ... }\n}`}
                </div>
                <div className="absolute bottom-[20%] left-[8%] rotate-[4deg] text-[#7A4FFF]">
                    {`const [formData, setFormData] = useState({\n  role: "CLIENT",\n  tech: "FULLSTACK"\n});`}
                </div>
                <div className="absolute top-[45%] left-[2%] rotate-[10deg] text-zinc-300">
                    {`INSERT INTO users (email, nickname, role)\nVALUES (?, ?, ?);`}
                </div>
                <div className="absolute top-[10%] right-[15%] rotate-[-8deg] text-[#FF7D00]">
                    {`# Docker Compose\nservices:\n  db:\n    image: mysql:8.0\n    environment:\n      MYSQL_ROOT_PASSWORD: devnear`}
                </div>
                <div className="absolute top-[35%] right-[5%] rotate-[2deg] text-zinc-400">
                    {`# Git Flow\n$ git checkout -b feature/signup-logic\n$ git commit -m "feat: complete onboarding"`}
                </div>
            </div>

            {/* [상단 네비게이션] */}
            <nav className="w-full py-5 px-10 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span>
                    <span className="text-[#7A4FFF]">Near</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center px-8 mt-24 mb-12">

                {/* 좌측: 브랜딩 문구 */}
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-8 h-[2px] bg-[#7A4FFF]"></span>
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">New Member Registration</span>
                    </div>
                    <h1 className="text-7xl font-black leading-tight mb-8 tracking-tighter text-zinc-900">
                        Join the <br />
                        <span className="text-[#7A4FFF]">Network,</span> <br />
                        Share your <span className="text-[#FF7D00]">Skill.</span>
                    </h1>
                    <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">
                        DevNear의 새로운 회원이 되어 <br />
                        마스터의 능력을 세상에 타당하게 증명해 보세요.
                    </p>
                </div>

                {/* 우측: 회원가입 카드 */}
                <div className="bg-white/95 p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[3rem] border border-zinc-100 relative overflow-hidden group">
                    <h2 className="text-3xl font-bold mb-2 text-zinc-900 tracking-tight">회원 가입</h2>
                    <p className="text-zinc-400 mb-8 text-sm font-medium italic">// Create your account to get started</p>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Name</label>
                                <input
                                    value={formData.name} // [추가] value 바인딩
                                    placeholder="실명"
                                    className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all"
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Nickname</label>
                                <input
                                    value={formData.nickname} // [추가] value 바인딩
                                    placeholder="닉네임"
                                    className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all"
                                    onChange={(e) => setFormData({...formData, nickname: e.target.value})} required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Email Address</label>
                            <input
                                value={formData.email} // [추가] value 바인딩
                                type="email" placeholder="example@devnear.com" className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Password</label>
                            <input
                                value={formData.password} // [추가] value 바인딩
                                type="password" placeholder="••••••••" className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                        </div>

                        {/* 역할 선택 */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Select Role</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "FREELANCER", label: "🎨 프리랜서" },
                                    { id: "CLIENT", label: "💼 클라이언트" },
                                    { id: "BOTH", label: "🚀 둘 다 활동" }
                                ].map((role) => (
                                    <div
                                        key={role.id}
                                        onClick={() => setFormData({...formData, role: role.id})}
                                        className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all ${formData.role === role.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                                    >
                                        <p className="font-bold text-xs">{role.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-black text-lg hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] transition-all shadow-lg active:scale-95 disabled:bg-zinc-200 mt-4"
                        >
                            {loading ? "등록 중..." : "등록 완료"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-white px-4 text-zinc-300">Or Quick Start</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border border-zinc-100 p-4 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-600 mb-6"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                        Google 계정으로 가입
                    </button>

                    <p className="text-center text-sm text-zinc-400 font-medium">
                        이미 계정이 있으신가요? <Link href="/login" className="text-[#7A4FFF] font-bold hover:text-[#FF7D00] transition-colors underline underline-offset-4">로그인하기</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}