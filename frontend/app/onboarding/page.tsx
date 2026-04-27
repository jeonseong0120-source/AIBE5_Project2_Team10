"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
    User,
    Briefcase,
    Rocket,
    ArrowRight,
    ChevronLeft,
    Sparkles,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import api from "../lib/axios";
import { notifyAuthChanged } from "../lib/authEvents";
import { postLoginPathForRole } from "../lib/postLoginRedirect"; // 🎯 [추가] 공통 리다이렉트 경로 모듈
import ClientExtraForm from "@/components/onboarding/ClientExtraForm";
import FreelancerExtraForm from "@/components/onboarding/FreelancerExtraForm";
import { dnAlert } from "@/lib/swal";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
};

const stepTransition: Variants = {
    initial: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: (direction: number) => ({ x: direction > 0 ? -50 : 50, opacity: 0, transition: { duration: 0.3 } })
};

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");

    const [clientData, setClientData] = useState({ companyName: "", representativeName: "", bn: "", introduction: "", homepageUrl: "", phoneNum: "" });
    const [freelancerData, setFreelancerData] = useState({ introduction: "", location: "", latitude: 37.5665, longitude: 126.9780, hourlyRate: 0, workStyle: "HYBRID", skillIds: [] as number[] });

    useEffect(() => {
        const checkGuest = async () => {
            try {
                const res = await api.get("/v1/users/me");
                const currentRole = res.data.role;
                if (!(currentRole === "GUEST" || currentRole === "ROLE_GUEST")) { router.push("/"); return; }
                if (res.data.nickname || res.data.name) setNickname(res.data.nickname || res.data.name);
                setLoading(false);
            } catch (err) { router.push("/"); }
        };
        checkGuest();
    }, [router]);

    const handleNext = async () => {
        setDirection(1);
        if (step === 1) {
            if (!nickname.trim() || !role) {
                await dnAlert("닉네임과 역할을 선택해주세요.", "warning");
                return;
            }
            if (role === "FREELANCER") setStep(3); else setStep(2);
        } else if (step === 2) {
            if (role === "BOTH") setStep(3); else void handleSubmit();
        } else if (step === 3) void handleSubmit();
    };

    const handleBack = () => {
        setDirection(-1);
        if (step === 3 && role === "FREELANCER") setStep(1); else setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const onboardingPayload: any = { nickname: nickname.trim(), role: role };
            if (role === "CLIENT" || role === "BOTH") onboardingPayload.clientProfile = { ...clientData, nickname: nickname.trim() };
            if (role === "FREELANCER" || role === "BOTH") onboardingPayload.freelancerProfile = freelancerData;

            const res = await api.post("/v1/users/onboarding", onboardingPayload);
            // 🎯 [이 줄을 추가하십시오!] 백엔드가 도대체 뭘 줬는지 통째로 출력해 봅니다.
            console.log("🔥 백엔드 응답 전체 데이터:", res.data);
            const newToken = res.data.accessToken;

            if (newToken) {
                localStorage.setItem("accessToken", newToken); // 여기서 덮어씌워짐
                notifyAuthChanged();
            } else {
                console.error("백엔드가 토큰을 안 줬습니다!"); // 만약 토큰이 안왔다면 여기서 걸립니다.
            }

            if (newToken) {
                localStorage.setItem("accessToken", newToken);
                notifyAuthChanged();
            }

            await dnAlert("권한 설정 완료!", "success");
            setTimeout(() => {
                // 🎯 백엔드 트랜잭션이 완전히 끝날 수 있도록 1초(1000ms)만 기다림
                window.location.href = postLoginPathForRole(role);
            }, 1000);

        } catch (err: any) {
            await dnAlert("설정 중 오류가 발생했습니다.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#7A4FFF] animate-pulse">Initializing_Agent...</div>
    );

    return (
        <div className="relative min-h-screen bg-zinc-50 font-sans text-zinc-900 overflow-x-hidden selection:bg-[#7A4FFF]/30">
            {/* ─── Background Layers ─── */}
            <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)', backgroundSize: '44px 44px' }}></div>
            <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#7A4FFF] opacity-[0.04] blur-[150px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FF7D00] opacity-[0.04] blur-[150px] rounded-full z-0 pointer-events-none"></div>

            {/* 🛰️ 웅장한 행성급 로고 배경 */}
            <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <img
                    src="/devnear-logo.png"
                    alt="Background Logo"
                    className="w-[140vw] max-w-none opacity-[0.14] scale-[1.4] select-none will-change-transform mix-blend-soft-light"
                />


                {/* subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF7D00]/5 via-transparent to-[#7A4FFF]/5" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto min-h-screen flex items-center justify-center px-6 pt-12 pb-12">
                <div className="w-full grid lg:grid-cols-2 gap-16 items-center">
                    <div className="hidden lg:block space-y-8">
                        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-zinc-200/50 mb-6">
                                <Sparkles size={14} className={step === 1 ? 'text-[#FF7D00]' : 'text-[#7A4FFF]'} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Protocol_{step}/3</span>
                            </div>
                            <h1 className="text-6xl xl:text-7xl font-black leading-[1.1] tracking-tighter text-zinc-900">
                                {step === 1 ? <>프로필 완성,<br />접속의 시작.</> : step === 2 ? <>비즈니스<br />워크플로우 설정.</> : <>당신의 기술을<br />정의하세요.</>}
                            </h1>
                        </motion.div>
                        <p className="text-zinc-500 text-xl font-medium max-w-sm leading-relaxed">DevNear 서비스의 정식 회원이 되기 위한 절차입니다. 정교하게 입력할수록 더 나은 매칭을 보장합니다.</p>
                    </div>

                    <motion.div layout className="bg-white/80 backdrop-blur-2xl p-8 md:p-12 shadow-2xl rounded-[3.5rem] border border-white relative overflow-hidden min-h-[580px] flex flex-col">
                        <motion.div layoutId="accent-line" className={`absolute top-0 left-0 h-1.5 transition-colors duration-500 ${step === 1 ? 'bg-[#FF7D00] w-1/3' : step === 2 ? 'bg-[#7A4FFF] w-2/3' : 'bg-zinc-900 w-full'}`} />
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">회원 설정</h2>
                            <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase tracking-widest font-mono">// agent_init_seq_{step}</p>
                        </div>
                        <div className="flex-1 relative">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div key={step} custom={direction} variants={stepTransition} initial="initial" animate="animate" exit="exit" className="w-full">
                                    {step === 1 && (
                                        <div className="space-y-8">
                                            <div className="group">
                                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-3">Agent Nickname</label>
                                                <div className="relative">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00]" size={18} />
                                                    <input required type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="활동할 닉네임"
                                                           className="w-full pl-14 pr-6 py-4.5 bg-zinc-50/50 border border-zinc-100 rounded-2xl outline-none transition-all font-bold text-sm focus:ring-4 focus:ring-[#FF7D00]/10 focus:border-[#FF7D00]" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block">Select Agent Role</label>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {[ { id: "FREELANCER", label: "프리랜서", icon: <CheckCircle2 size={16} />, desc: "나의 기술로 가치를 만들고 싶어요" }, { id: "CLIENT", label: "클라이언트", icon: <Briefcase size={16} />, desc: "함께 성장할 파트너를 찾고 있어요" }, { id: "BOTH", label: "하이브리드", icon: <Rocket size={16} />, desc: "모든 가능성을 열어두고 싶어요" } ].map((opt) => (
                                                        <button key={opt.id} onClick={() => setRole(opt.id)}
                                                                className={`group p-5 rounded-[2rem] border-2 text-left transition-all ${role === opt.id ? "border-zinc-900 bg-zinc-900 text-white shadow-xl" : "border-zinc-100 bg-zinc-50/50 text-zinc-800 hover:border-zinc-200"}`}>
                                                            <div className="font-black text-base flex items-center gap-2 mb-1">
                                                                <span className={role === opt.id ? 'text-[#7A4FFF]' : 'text-zinc-400'}>{opt.icon}</span>{opt.label}
                                                            </div>
                                                            <div className="text-[11px] font-medium opacity-60">{opt.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {step === 2 && <div className="space-y-6"><ClientExtraForm clientData={clientData} setClientData={setClientData} /></div>}
                                    {step === 3 && <div className="space-y-6"><FreelancerExtraForm freelancerData={freelancerData} setFreelancerData={setFreelancerData} /></div>}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="mt-auto pt-10 flex gap-4">
                            {step > 1 && <button onClick={handleBack} className="flex-1 h-16 border border-zinc-200 rounded-2xl font-black text-sm text-zinc-400 flex items-center justify-center gap-2"><ChevronLeft size={18} /> 이전</button>}
                            <motion.button whileTap={{ scale: 0.98 }} onClick={handleNext} disabled={submitting}
                                           className={`flex-[2] h-16 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg ${submitting ? 'bg-zinc-200' : 'bg-zinc-950 text-white hover:bg-[#7A4FFF]'}`}>
                                {submitting ? "INITIALIZING..." : (step === 3 || (step === 2 && role === "CLIENT")) ? "기지 합류하기" : "다음 단계로"}<ArrowRight size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}