"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { notifyAuthChanged } from "../lib/authEvents";
import { AnimatePresence, motion } from "framer-motion";
import ClientExtraForm from "@/components/onboarding/ClientExtraForm";
import FreelancerExtraForm from "@/components/onboarding/FreelancerExtraForm";

export default function OnboardingPage() {
    const [step, setStep] = useState(1); // [추가] 현재 단계 (1, 2, 3)
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");

    const [clientData, setClientData] = useState({
        companyName: "", representativeName: "", bn: "", introduction: "", homepageUrl: "", phoneNum: ""
    });

    const [freelancerData, setFreelancerData] = useState({
        introduction: "",
        location: "",
        latitude: 37.5665,
        longitude: 126.9780,
        hourlyRate: 0,
        workStyle: "HYBRID",
        skillIds: [] as number[],
    });

    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkGuest = async () => {
            try {
                const res = await api.get("/v1/users/me");
                const currentRole = res.data.role;
                if (!(currentRole === "GUEST" || currentRole === "ROLE_GUEST")) {
                    router.push("/");
                    return;
                }
                // [AI 추가] 기존에 유저 이름이나 닉네임이 있다면 세팅해줌
                if (res.data.nickname || res.data.name) {
                    setNickname(res.data.nickname || res.data.name);
                }
                setLoading(false);
            } catch (err) {
                console.error("인증 실패", err);
                router.push("/login");
            }
        };
        checkGuest();
    }, [router]);

    // [로직] 다음 단계로 이동 제어
    const handleNext = () => {
        if (step === 1) {
            if (!nickname.trim() || !role) return alert("닉네임과 역할을 선택해주세요.");
            // 역할에 따른 분기: 프리랜서면 바로 3단계로, 아니면 2단계로
            if (role === "FREELANCER") setStep(3);
            else setStep(2);
        } else if (step === 2) {
            // BOTH면 다음(프리랜서)으로, CLIENT면 바로 제출
            if (role === "BOTH") setStep(3);
            else handleSubmit();
        } else if (step === 3) {
            handleSubmit();
        }
    };

    // [로직] 이전 단계로 이동
    const handleBack = () => {
        if (step === 3 && role === "FREELANCER") setStep(1);
        else setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const onboardingPayload: any = {
                nickname: nickname.trim(),
                role: role,
            };

            // [AI 리뷰 반영] ClientProfileRequest DTO에 닉네임이 필수이므로 동일하게 복사해서 넘김
            if (role === "CLIENT" || role === "BOTH") {
                onboardingPayload.clientProfile = {
                    ...clientData,
                    nickname: nickname.trim(),
                };
            }

            if (role === "FREELANCER" || role === "BOTH") {
                onboardingPayload.freelancerProfile = freelancerData;
            }

            const res = await api.post("/v1/users/onboarding", onboardingPayload);
            const newToken = res.data.accessToken;

            if (newToken) {
                localStorage.setItem("accessToken", newToken);
                api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                notifyAuthChanged();
            }

            alert("권한 설정 완료! 정식 회원이 되신 것을 환영합니다.");

            // 🔍 [수정] 역할에 따른 리다이렉트 경로 설정
            if (role === "FREELANCER") {
                // 프리랜서 전용 메인 페이지로 이동
                router.replace("/freelancer/main");
            } else {
                // 클라이언트나 BOTH(둘 다)인 경우 대시보드로 이동
                router.replace("/client/dashboard");
            }

        } catch (err: any) {
            console.error("온보딩 에러:", err);
            // 400 Bad Request 등의 상세 에러 메시지 표출
            let errorMessage = "설정 중 오류가 발생했습니다.";
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            alert(`수정 실패: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const stepVariants = {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
        transition: { duration: 0.3 }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-white font-black text-[#7A4FFF] text-xl animate-pulse">
            SCANNING AGENT STATUS...
        </div>
    );

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-x-hidden bg-white font-sans text-zinc-900">

            {/* [배경 레이어 - 기존 유지] */}
            <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#7A4FFF] opacity-[0.08] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#FF7D00] opacity-[0.08] blur-[120px] rounded-full"></div>

            {/* [상단 진행 바] */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 flex gap-3 z-50">
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${
                        step === s ? "w-12 bg-[#7A4FFF]" : s < step ? "w-6 bg-zinc-900" : "w-6 bg-zinc-200"
                    }`} />
                ))}
            </div>

            <nav className="w-full py-5 px-10 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-default"><span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span></div>
            </nav>

            <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center px-8 mt-32 mb-16">
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 mb-6"><span className="w-8 h-[2px] bg-[#FF7D00]"></span><span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Identity Initialization</span></div>
                    <h1 className="text-7xl font-black leading-tight mb-8 tracking-tighter text-zinc-900">Complete <br /><span className="text-[#FF7D00]">Profile,</span> <br />Start <span className="text-[#7A4FFF]">Access.</span></h1>
                    <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">단계별로 정보를 입력하고 <br /><span className="text-zinc-900 font-bold">DevNear</span>의 정식 멤버로 합류하세요.</p>
                </div>

                <div className="bg-white/95 p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] border border-zinc-100 relative overflow-hidden transition-all duration-500 min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">회원 설정 ({step}/3)</h2>
                            <p className="text-zinc-400 text-sm font-medium italic">// Step {step}: {step === 1 ? "Identity" : step === 2 ? "Business" : "Professional"}</p>
                        </div>
                    </div>

                    <form className="space-y-6 flex-1 flex flex-col" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex-1">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div key="step1" {...stepVariants}>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Agent Nickname</label>
                                                <input required type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="활동할 닉네임" className="w-full p-4 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Select Agent Role</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { id: "FREELANCER", label: "🎨 프리랜서", desc: "나의 기술로 가치를 만들고 싶어요" },
                                                        { id: "CLIENT", label: "💼 클라이언트", desc: "함께 성장할 파트너를 찾고 있어요" },
                                                        { id: "BOTH", label: "🚀 둘 다 할래요", desc: "모든 가능성을 열어두고 싶어요" },
                                                    ].map((opt) => (
                                                        <div key={opt.id} onClick={() => setRole(opt.id)} className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${role === opt.id ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-50 bg-zinc-50 text-zinc-800 hover:border-zinc-200"}`}>
                                                            <div className="font-bold text-sm">{opt.label}</div>
                                                            <div className="text-[10px] opacity-60">{opt.desc}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div key="step2" {...stepVariants}>
                                        <ClientExtraForm clientData={clientData} setClientData={setClientData} />
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div key="step3" {...stepVariants}>
                                        <FreelancerExtraForm freelancerData={freelancerData} setFreelancerData={setFreelancerData} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 하단 버튼 액션 */}
                        <div className="flex gap-3 pt-6 mt-auto">
                            {step > 1 && (
                                <button type="button" onClick={handleBack} className="flex-1 p-4 border border-zinc-200 rounded-2xl font-black text-zinc-400 hover:bg-zinc-50 transition-all">
                                    이전
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={loading}
                                className="flex-[2] bg-zinc-900 text-white p-4 rounded-2xl font-black text-lg hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] transition-all shadow-lg active:scale-95 disabled:bg-zinc-100"
                            >
                                {loading ? "처리 중..." : (step === 3 || (step === 2 && role === "CLIENT")) ? "합류하기" : "다음 단계로"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}