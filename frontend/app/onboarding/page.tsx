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
        const normalizedNickname = nickname.trim();
        if (!normalizedNickname) return alert("닉네임을 입력해주세요");
        if (!role) return alert("역할을 선택해주세요");

        setLoading(true);
        try {
            const res = await api.post("/api/v1/users/onboarding", { nickname: normalizedNickname, role });

            // [수정 포인트] 토큰이 없으면 여기서 바로 컷! (Fail-Fast)
            const newToken = res.data.accessToken;
            if (!newToken) {
                // 토큰이 없으면 에러를 던져서 catch 구문으로 보냅니다.
                throw new Error("인증 토큰을 받지 못했습니다. 다시 로그인해주세요.");
            }

            // 토큰이 있을 때만 안전하게 저장하고 다음 단계 진행
            localStorage.setItem("accessToken", newToken);
            console.log("정식 요원 증표 교체 완료!");

            try {
                              const userRes = await api.get("/api/v1/users/me");
                              alert(`${userRes.data.nickname}님, 합류를 환영합니다!`);
            } catch {
                                alert(`${normalizedNickname}님, 합류를 환영합니다!`);
            }
            +            router.replace("/");

        } catch (err: any) {
            // 토큰 누락 에러나 API 에러가 여기서 타당하게 처리됩니다.
            alert(err.message || err.response?.data?.message || "설정 중 오류 발생");
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