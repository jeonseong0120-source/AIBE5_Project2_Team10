"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // [상태 관리] 기본 계정 정보
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        nickname: "", // 초기값은 빈 값으로 보내고 온보딩에서 정식 설정
        role: "GUEST"  // 회원가입 직후에는 GUEST 권한을 부여하여 온보딩으로 유도
    });

    // [상태 관리] 유효성 검사 에러 메시지
    const [errors, setErrors] = useState({
        email: "",
        password: "",
        name: "",
    });

    // [로직] 정규표현식 기반 유효성 검사
    const validate = () => {
        let isValid = true;
        const newErrors = { email: "", password: "", name: "" };

        // 1. 이메일 형식 체크
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = "타당한 이메일 형식이 아닙니다.";
            isValid = false;
        }

        // 2. 비밀번호 형식 체크 (최소 8자, 영문+숫자 혼합)
       // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        //if (!passwordRegex.test(formData.password)) {
           // newErrors.password = "비밀번호는 8자 이상, 영문과 숫자를 혼합해야 합니다.";
           // isValid = false;
        //}

        // 3. 이름 체크 (공백 제외 2자 이상)
        if (formData.name.trim().length < 2) {
            newErrors.name = "성함은 최소 2자 이상 입력해 주세요.";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // [핸들러] 회원가입 제출
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // 프론트엔드 1차 방어선
        if (!validate()) return;

        setLoading(true);
        try {
            // 백엔드 /auth/signup API 호출
            await api.post("/auth/signup", formData);
            alert("계정 생성이 완료되었습니다! 이제 로그인을 통해 프로필을 설정해 주세요.");
            router.push("/login"); // 로그인 페이지로 리다이렉트
        } catch (err: any) {
            console.error("회원가입 에러:", err);
            alert(err.response?.data?.message || "이미 등록된 이메일이거나 서버 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // [핸들러] 구글 소셜 로그인
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

            {/* [배경 레이어 3] 코드 데코레이션 */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none opacity-[0.25] font-mono text-[11px] md:text-[14px] p-10 leading-relaxed">
                <div className="absolute top-[15%] left-[5%] rotate-[-3deg] text-[#FF7D00]">
                    {`@RestController\npublic class AuthController {\n  @PostMapping("/signup")\n  public ResponseEntity<?> signup() { ... }\n}`}
                </div>
                <div className="absolute bottom-[20%] left-[8%] rotate-[4deg] text-[#7A4FFF]">
                    {`const [formData, setFormData] = useState({\n  role: "GUEST",\n  status: "PENDING"\n});`}
                </div>
                <div className="absolute top-[45%] left-[2%] rotate-[10deg] text-zinc-300">
                    {`INSERT INTO users (email, name, role)\nVALUES (?, ?, 'ROLE_GUEST');`}
                </div>
                <div className="absolute top-[10%] right-[15%] rotate-[-8deg] text-[#FF7D00]">
                    {`# Infrastructure\nservices:\n  auth-service:\n    image: devnear/auth:latest`}
                </div>
                <div className="absolute top-[35%] right-[5%] rotate-[2deg] text-zinc-400">
                    {`$ git checkout -b feat/user-auth\n$ git commit -m "feat: implement regex validation"`}
                </div>
            </div>

            {/* [상단 네비게이션] */}
            <nav className="w-full py-5 px-10 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <img
                        src="/devnear-logo.png" 
                        alt="DevNear_Logo"
                        className="h-8 w-auto object-contain inline-block mr-2" 
                    />
                    <span className="text-[#FF7D00]">Dev</span>
                    <span className="text-[#7A4FFF]">Near</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center px-8 mt-24 mb-12">

                {/* 좌측: 브랜딩 문구 */}
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-8 h-[2px] bg-[#7A4FFF]"></span>
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Step 01: Account Setup</span>
                    </div>
                    <h1 className="text-7xl font-black leading-tight mb-8 tracking-tighter text-zinc-900">
                        Join the <br />
                        <span className="text-[#7A4FFF]">Network,</span> <br />
                        Share your <span className="text-[#FF7D00]">Skill.</span>
                    </h1>
                    <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">
                        DevNear의 정식 요원이 되기 위한 첫 단계입니다.<br />
                        계정 생성 후 마스터만의 특별한 프로필을 완성해 보세요.
                    </p>
                </div>

                {/* 우측: 회원가입 카드 */}
                <div className="bg-white/95 p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[3rem] border border-zinc-100 relative overflow-hidden group">
                    <h2 className="text-3xl font-bold mb-2 text-zinc-900 tracking-tight">계정 생성</h2>
                    <p className="text-zinc-400 mb-8 text-sm font-medium italic">// Initialize your agent identity</p>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Email Address</label>
                            <input
                                value={formData.email}
                                type="email"
                                placeholder="example@devnear.com"
                                className={`w-full p-4 bg-zinc-50 border rounded-2xl outline-none transition-all ${errors.email ? 'border-red-400' : 'border-zinc-100 focus:ring-2 focus:ring-[#7A4FFF]'}`}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                            />
                            {errors.email && <p className="text-[10px] text-red-500 ml-2 font-bold">{errors.email}</p>}
                        </div>

                        {/* Name Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Full Name</label>
                            <input
                                value={formData.name}
                                placeholder="마스터의 성함"
                                className={`w-full p-4 bg-zinc-50 border rounded-2xl outline-none transition-all ${errors.name ? 'border-red-400' : 'border-zinc-100 focus:ring-2 focus:ring-[#7A4FFF]'}`}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                            {errors.name && <p className="text-[10px] text-red-500 ml-2 font-bold">{errors.name}</p>}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Password</label>
                            <input
                                value={formData.password}
                                type="password"
                                placeholder="••••••••"
                                className={`w-full p-4 bg-zinc-50 border rounded-2xl outline-none transition-all ${errors.password ? 'border-red-400' : 'border-zinc-100 focus:ring-2 focus:ring-[#7A4FFF]'}`}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                            />
                            {errors.password && <p className="text-[10px] text-red-500 ml-2 font-bold">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-black text-xl hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] transition-all shadow-lg active:scale-95 disabled:bg-zinc-200 mt-6"
                        >
                            {loading ? "CHECKING..." : "가입 완료"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-white px-4 text-zinc-300">Or Quick Start</span></div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border border-zinc-100 p-4 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-600 mb-6"
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                        Google 계정으로 계속하기
                    </button>

                    <p className="text-center text-sm text-zinc-400 font-medium">
                        이미 계정이 있으신가요? <Link href="/login" className="text-[#7A4FFF] font-bold hover:text-[#FF7D00] transition-colors underline underline-offset-4">로그인하기</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}