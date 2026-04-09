"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "../lib/axios";

export default function OnboardingPage() {
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkGuest = async () => {
            try {
                const res = await api.get("/api/v1/users/me");
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
        if (!role) return alert("역할을 선택해주세요");

        setLoading(true);
        try {
            // 1. 온보딩 요청을 보내고 '새로운 토큰'이 담긴 응답을 받습니다.
            const res = await api.post("/api/v1/users/onboarding", { nickname, role });

            // 2. [핵심] 백엔드가 준 승격된 새 토큰(ROLE_USER 등)을 금고에 저장합니다.
            // 백엔드 DTO 구조에 따라 res.data.accessToken 또는 res.data 등으로 확인 필요!
            const newToken = res.data.accessToken;
            if (newToken) {
                localStorage.setItem("accessToken", newToken);
                console.log("새로운 정식 요원 증표 저장 완료!");
            }

            // 3. 이제 새 토큰을 들고 내 정보를 다시 가져옵니다. (이제 정식 요원으로 보임)
            const userRes = await api.get("/api/v1/users/me");
            alert(`${userRes.data.nickname}님, DevNear에 오신 것을 환영합니다!`);

            router.push("/");
        } catch (err: any) {
            alert(err.response?.data?.message || "설정 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };
    if (loading) return <div className="flex min-h-screen items-center justify-center bg-white font-bold">기지 스캔 중...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            {/* 상단 네비게이션 바 (웹사이트 느낌) */}
            <nav className="w-full py-6 px-10 bg-white/50 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center fixed top-0 z-50">
                <div className="font-black text-2xl tracking-tighter">
                    <span className="text-dn-orange">Dev</span>Near
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-6">
                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* 왼쪽: 서비스 안내 (웹 전용 레이아웃) */}
                    <div className="hidden lg:block space-y-8">
                        <h1 className="text-6xl font-black leading-[1.1] text-zinc-900">
                            당신의 <span className="text-dn-purple">재능</span>을<br/>
                            세상과 <span className="text-dn-orange">연결</span>하세요.
                        </h1>
                        <p className="text-xl text-zinc-500 leading-relaxed font-medium">
                            DevNear는 프리랜서와 클라이언트를 가장 타당하게 이어주는 공간입니다. <br/>
                            활동을 시작하기 전에 마지막 정보를 완성해주세요.
                        </p>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-dn-cream rounded-full border border-dn-orange/20 text-dn-orange font-bold">#AI_BigData</div>
                            <div className="px-6 py-3 bg-dn-cream rounded-full border border-dn-purple/20 text-dn-purple font-bold">#Developer</div>
                        </div>
                    </div>

                    {/* 오른쪽: 입력 폼 카드 */}
                    <div className="bg-white p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-zinc-100">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-zinc-900 mb-2">회원 정보 설정</h2>
                            <p className="text-zinc-400">활동에 필요한 기본 정보를 입력해주세요.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* 닉네임 입력 */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-700 ml-1">닉네임</label>
                                <input
                                    required
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    // [핵심] text-zinc-900으로 글자색을 진하게 고정!
                                    className="w-full px-6 py-4 text-lg rounded-2xl border-2 border-zinc-100 bg-zinc-50 text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:border-dn-purple outline-none transition-all"
                                    placeholder="사용할 닉네임을 입력하세요"
                                />
                            </div>

                            {/* 역할 선택 */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-700 ml-1">활동 역할</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: "FREELANCER", label: "🎨 프리랜서", desc: "나의 기술로 가치를 만들고 싶어요" },
                                        { id: "CLIENT", label: "💼 클라이언트", desc: "함께 성장할 파트너를 찾고 있어요" },
                                        { id: "BOTH", label: "🚀 둘 다 할래요", desc: "모든 가능성을 열어두고 싶어요" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setRole(opt.id)}
                                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                                role === opt.id
                                                    ? "border-dn-orange bg-dn-cream"
                                                    : "border-zinc-50 bg-zinc-50 hover:border-zinc-200"
                                            }`}
                                        >
                                            <div className={`font-bold text-lg ${role === opt.id ? "text-dn-orange" : "text-zinc-800"}`}>
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-zinc-400">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                disabled={loading || !nickname || !role}
                                className="w-full py-5 rounded-2xl bg-zinc-900 text-white font-black text-xl hover:bg-dn-purple transition-all shadow-xl active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400"
                            >
                                {loading ? "저장 중..." : "설정 완료"}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}