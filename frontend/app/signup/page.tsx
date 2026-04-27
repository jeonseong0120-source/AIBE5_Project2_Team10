"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
    MapPin
} from "lucide-react";
import api from "../lib/axios";
import { notifyAuthChanged } from "../lib/authEvents";
import { dnAlert } from "@/lib/swal";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    })
};

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false); // 🎯 가입 성공 상태 추가

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        nickname: "",
        role: "GUEST"
    });

    const [errors, setErrors] = useState({ email: "", password: "", name: "" });

    const validate = () => {
        let isValid = true;
        const newErrors = { email: "", password: "", name: "" };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = "타당한 이메일 형식이 아닙니다.";
            isValid = false;
        }
        if (formData.name.trim().length < 2) {
            newErrors.name = "성함은 최소 2자 이상 입력해 주세요.";
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // 1. 회원가입 요청
            await api.post("/auth/signup", formData);

            // 2. 🎯 자동 로그인 시도 (가입과 로그인 에러를 분리하여 처리)
            try {
                const loginRes = await api.post("/auth/login", {
                    email: formData.email,
                    password: formData.password
                });

                const { accessToken } = loginRes.data;
                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                    notifyAuthChanged();
                    router.push("/onboarding");
                    return; // 성공 시 여기서 종료
                }
            } catch (loginErr) {
                // 🎯 로그인만 실패한 경우: 가입 성공 상태로 전환
                setSignupSuccess(true);
                await dnAlert("회원가입에 성공했습니다! 생성하신 계정으로 로그인을 진행해 주세요.", "success");
                // 필요 시 로그인을 유도하는 모달을 띄우거나 이동
                router.push("/"); // 혹은 로그인 페이지
            }
        } catch (err: any) {
            // 회원가입 자체가 실패한 경우만 기존 에러 메시지 출력
            await dnAlert(err.response?.data?.message || "이미 등록된 이메일이거나 서버 오류가 발생했습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // 🎯 [수정] axios 설정과 동일한 NEXT_PUBLIC_API_BASE_URL 사용
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div className="relative min-h-screen bg-zinc-50 font-sans text-zinc-900 overflow-x-hidden selection:bg-[#7A4FFF]/30">
            <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
                 style={{ backgroundImage: 'linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)', backgroundSize: '44px 44px' }}></div>
            <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#7A4FFF] opacity-[0.05] blur-[150px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FF7D00] opacity-[0.05] blur-[150px] rounded-full z-0 pointer-events-none"></div>

            <div className="relative z-10 max-w-6xl mx-auto min-h-screen flex items-center justify-center px-6">
                <div className="w-full grid lg:grid-cols-2 gap-16 items-center py-12">
                    <div className="hidden lg:block space-y-8">
                        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                            <motion.div variants={fadeUp} custom={0}>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-zinc-200/50 mb-6">
                                    <Sparkles size={14} className="text-[#FF7D00]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Step 01: Agent Identity</span>
                                </div>
                                <h1 className="text-6xl xl:text-7xl font-black leading-[1.1] tracking-tighter text-zinc-900">
                                    당신의 <span className="text-[#7A4FFF]">기술</span>을<br />
                                    가장 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF]">타당하게</span><br />
                                    증명하는 공간.
                                </h1>
                            </motion.div>
                            <motion.p variants={fadeUp} custom={1} className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed mt-8">
                                신뢰할 수 있는 파트너들이 회원님을 기다리고 있습니다.
                            </motion.p>
                            <motion.div variants={fadeUp} custom={2} className="space-y-5 mt-10">
                                {[
                                    { icon: <CheckCircle2 size={18} />, text: "AI 기반 기술 스택 자동 매핑", color: "text-[#7A4FFF]" },
                                    { icon: <ShieldCheck size={18} />, text: "검증된 포트폴리오 아카이빙", color: "text-[#FF7D00]" },
                                    { icon: <MapPin size={18} />, text: "초정밀 지역 기반 협업 매칭", color: "text-zinc-900" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 text-zinc-700 font-bold">
                                        <div className={`${item.color} p-2 bg-white rounded-xl shadow-sm border border-zinc-100`}>{item.icon}</div>
                                        <span className="text-lg tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                                className="bg-white/80 backdrop-blur-2xl p-8 md:p-12 shadow-2xl rounded-[3.5rem] border border-white relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7A4FFF] to-[#FF7D00]" />
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">신규 회원 등록</h2>
                            <p className="text-zinc-400 text-sm font-medium mt-2 italic font-mono">// Initialize_Agent_Protocol</p>
                        </div>
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF]" size={18} />
                                        <input value={formData.email} type="email" placeholder="agent@devnear.com" required
                                               className={`w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border rounded-2xl outline-none transition-all font-bold text-sm ${errors.email ? 'border-red-400 ring-4 ring-red-500/10' : 'border-zinc-100 focus:ring-4 focus:ring-[#7A4FFF]/10 focus:border-[#7A4FFF]'}`}
                                               onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00]" size={18} />
                                        <input value={formData.name} placeholder="이름을 입력해주세요" required
                                               className={`w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border rounded-2xl outline-none transition-all font-bold text-sm ${errors.name ? 'border-red-400 ring-4 ring-red-500/10' : 'border-zinc-100 focus:ring-4 focus:ring-[#FF7D00]/10 focus:border-[#FF7D00]'}`}
                                               onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#7A4FFF]" size={18} />
                                        <input value={formData.password} type="password" placeholder="••••••••" required
                                               className="w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border border-zinc-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#7A4FFF]/10 focus:border-[#7A4FFF] transition-all font-bold text-sm"
                                               onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                            <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                                           className="w-full bg-zinc-950 text-white h-16 rounded-2xl font-black text-lg shadow-xl hover:bg-[#7A4FFF] transition-all disabled:bg-zinc-200 flex items-center justify-center gap-3">
                                {loading ? "INITIALIZING..." : "계정 생성하기"}
                                {!loading && <ArrowRight size={20} />}
                            </motion.button>
                        </form>
                        <div className="relative my-10 text-center">
                            <span className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></span>
                            <span className="relative bg-white px-5 text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em]">Or Connect Via</span>
                        </div>
                        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 border border-zinc-200 h-14 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-700 text-sm">
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                            Google 계정으로 계속하기
                        </button>
                    </motion.div>
                </div>
            </div>
            <footer className="relative z-10 pb-12 text-center opacity-40">
                <p className="text-zinc-400 text-[9px] font-black uppercase tracking-[0.4em] font-mono">© 2026 Base_Command_Center. Initializing_Agent_Sequence.</p>
            </footer>
        </div>
    );
}