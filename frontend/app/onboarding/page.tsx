"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";

export default function OnboardingPage() {
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkGuest = async () => {
            try {
                // api 인스턴스에 이미 baseURL이 /api로 설정되어 있으므로 /api를 빼야 합니다.
                const res = await api.get("/v1/users/me");
                const currentRole = res.data.role;
                if (!(currentRole === "GUEST" || currentRole === "ROLE_GUEST")) {
                    router.push("/");
                    return;
                }
                setLoading(false);
            } catch (err) {
                console.error("인증 실패", err);
                router.push("/login");
            }
        };
        checkGuest();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedNickname = nickname.trim();
        if (!normalizedNickname) return alert("닉네임을 입력해주세요");
        if (!role) return alert("역할을 선택해주세요");

        setLoading(true);
        try {
            // api 인스턴스에 이미 baseURL이 /api로 설정되어 있으므로 /api를 빼야 합니다.
            const res = await api.post("/v1/users/onboarding", { nickname: normalizedNickname, role });

            // 토큰이 없으면 여기서 바로 컷! (Fail-Fast)
            const newToken = res.data.accessToken;
            if (!newToken) {
                throw new Error("인증 토큰을 받지 못했습니다. 다시 로그인해주세요.");
            }

            // 토큰이 있을 때만 안전하게 저장하고 다음 단계 진행
            localStorage.setItem("accessToken", newToken);
            console.log("정식 요원 증표 교체 완료!");

            try {
                const userRes = await api.get("/v1/users/me");
                alert(`${userRes.data.nickname}님, 합류를 환영합니다!`);
            } catch {
                alert(`${normalizedNickname}님, 합류를 환영합니다!`);
            }
            router.replace("/");

        } catch (err: any) {
            alert(err.message || err.response?.data?.message || "설정 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-white font-black text-[#7A4FFF] text-xl animate-pulse">
            SCANNING AGENT STATUS...
        </div>
    );

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-white font-sans text-zinc-900">

            {/* [배경 레이어 1] 설계도 그리드 */}
            <div className="absolute inset-0 z-0 opacity-[0.4]"
                 style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            {/* [배경 레이어 2] 메쉬 글로우 */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#7A4FFF] opacity-[0.08] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#FF7D00] opacity-[0.08] blur-[120px] rounded-full"></div>

            {/* [배경 레이어 3] 온보딩 전용 코드 데코레이션 */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none opacity-[0.12] font-mono text-[11px] md:text-[14px] p-10 leading-relaxed">
                <div className="absolute top-[15%] left-[5%] rotate-[-3deg] text-[#FF7D00]">
                    {`@PostMapping("/v1/users/onboarding")\npublic ResponseEntity<?> setupProfile() {\n  return ResponseEntity.ok(new TokenResponse(accessToken));\n}`}
                </div>
                <div className="absolute bottom-[20%] left-[8%] rotate-[4deg] text-[#7A4FFF]">
                    {`const handleOnboarding = async () => {\n  const res = await api.post("/v1/users/onboarding", { nickname, role });\n  localStorage.setItem("accessToken", res.data.accessToken);\n}`}
                </div>
                <div className="absolute top-[45%] left-[2%] rotate-[10deg] text-zinc-300">
                    {`UPDATE members SET \n  nickname = :nickname, \n  role = :role \nWHERE member_id = :id;`}
                </div>
                <div className="absolute top-[10%] right-[15%] rotate-[-8deg] text-[#FF7D00]">
                    {`# Agent Deployment\nmetadata:\n  name: devnear-new-agent\n  labels:\n    status: guest-to-member`}
                </div>
                <div className="absolute bottom-[35%] right-[12%] rotate-[-15deg] text-[#7A4FFF]">
                    {`$ git branch -M main\n$ git add . \n$ git commit -m "feat: complete onboarding"`}
                </div>
            </div>

            {/* [상단 네비게이션] 블랙 배경 + 컬러 로고 */}
            <nav className="w-full py-5 px-10 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-default">
                    <span className="text-[#FF7D00]">Dev</span>
                    <span className="text-[#7A4FFF]">Near</span>
                </div>
            </nav>

            <div className="relative z-10 max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center px-8 mt-24 mb-12">

                {/* 좌측: 브랜딩 문구 */}
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Identity Initialization</span>
                    </div>
                    <h1 className="text-7xl font-black leading-tight mb-8 tracking-tighter text-zinc-900">
                        Complete <br />
                        <span className="text-[#FF7D00]">Profile,</span> <br />
                        Start <span className="text-[#7A4FFF]">Access.</span>
                    </h1>
                    <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">
                        이제 마지막 단계입니다. <br />
                        devnear에서 사용할 <span className="text-zinc-900 font-bold">닉네임</span>과 <span className="text-zinc-900 font-bold">역할</span>을 선택하여 정식 회원으로 등록하세요.
                    </p>
                </div>

                {/* 우측: 온보딩 카드 */}
                <div className="bg-white/95 p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] border border-zinc-100 relative overflow-hidden">
                    <h2 className="text-3xl font-bold mb-2 text-zinc-900 tracking-tight">회원 정보 설정</h2>
                    <p className="text-zinc-400 mb-8 text-sm font-medium italic">// Finish setting up your account</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest group-focus-within:text-[#7A4FFF]">Agent Nickname</label>
                            <input
                                required
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="활동할 닉네임을 입력하세요"
                                className="w-full p-4 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] focus:bg-white outline-none transition-all placeholder:text-zinc-300"
                            />
                        </div>

                        {/* 역할 선택 섹션 */}
                        <div className="space-y-3 pt-2">
                            <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest">Select Agent Role</label>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "FREELANCER", label: "🎨 프리랜서", desc: "나의 기술로 가치를 만들고 싶어요" },
                                    { id: "CLIENT", label: "💼 클라이언트", desc: "함께 성장할 파트너를 찾고 있어요" },
                                    { id: "BOTH", label: "🚀 둘 다 할래요", desc: "모든 가능성을 열어두고 싶어요" },
                                ].map((opt) => (
                                    <div
                                        key={opt.id}
                                        onClick={() => setRole(opt.id)}
                                        className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                                            role === opt.id
                                                ? "border-zinc-900 bg-zinc-900 text-white"
                                                : "border-zinc-50 bg-zinc-50 text-zinc-800 hover:border-zinc-200"
                                        }`}
                                    >
                                        <div className="font-bold text-base">{opt.label}</div>
                                        <div className={`text-xs ${role === opt.id ? "text-zinc-400" : "text-zinc-400"}`}>{opt.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !nickname || !role}
                            className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] transition-all shadow-lg active:scale-95 disabled:bg-zinc-200 mt-4"
                        >
                            {loading ? "기록 중..." : "설정 완료"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}