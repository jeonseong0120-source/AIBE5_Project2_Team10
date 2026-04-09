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

    return (
        // [수정] pt-32를 추가하여 네비게이션 바 높이만큼 밀어내고, pb-12로 하단 여백 확보
        <div className="flex flex-col items-center justify-center min-h-screen p-6 pt-32 pb-12 font-sans">

            {/* 상단 네비게이션 바 - 고정 위치 유지 */}
            <nav className="w-full py-6 px-10 bg-white/70 backdrop-blur-md border-b border-zinc-100 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-dn-orange">Dev</span>Near
                </div>
                {/* 우측에 간단한 링크나 버튼이 필요하면 여기에 추가 가능 */}
            </nav>

            {/* 회원가입 카드 */}
            <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-10 shadow-2xl rounded-[2.5rem] border border-white transition-all">
                <h2 className="text-3xl font-extrabold mb-2 text-zinc-800 tracking-tight">회원 정보 설정</h2>
                <p className="text-zinc-400 mb-8 text-sm font-medium">활동에 필요한 기본 정보를 입력해주세요.</p>

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 ml-1">이메일</label>
                        <input placeholder="email@example.com" className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-400 ml-1">비밀번호</label>
                        <input type="password" placeholder="••••••••" className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 ml-1">실명</label>
                            <input placeholder="성함" className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 ml-1">닉네임</label>
                            <input placeholder="별명" className="w-full p-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-dn-purple outline-none transition-all" onChange={(e) => setFormData({...formData, nickname: e.target.value})} required />
                        </div>
                    </div>

                    {/* 활동 역할 선택 (온보딩 디자인 완벽 이식) */}
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-bold text-zinc-400 ml-1 uppercase">활동 역할</label>
                        {[
                            { id: "FREELANCER", label: "🎨 프리랜서", desc: "나의 기술로 가치를 만들어 보세요" },
                            { id: "CLIENT", label: "💼 클라이언트", desc: "함께 성장할 파트너를 찾고 있어요" },
                            { id: "BOTH", label: "🚀 둘 다 할래요", desc: "모든 기능을 열어두고 싶어요" }
                        ].map((role) => (
                            <div
                                key={role.id}
                                onClick={() => setFormData({...formData, role: role.id})}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.role === role.id ? 'border-dn-purple bg-dn-purple/5' : 'border-zinc-50 bg-zinc-50 hover:border-zinc-200 shadow-sm'}`}
                            >
                                <p className="font-bold text-sm text-zinc-800">{role.label}</p>
                                <p className="text-xs text-zinc-400">{role.desc}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-bold hover:bg-dn-purple transition-all shadow-lg active:scale-95 disabled:bg-zinc-300 mt-6"
                    >
                        {loading ? "처리 중..." : "설정 완료"}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-zinc-400 font-medium">
                    이미 계정이 있으신가요? <Link href="/login" className="text-dn-purple font-bold hover:underline">로그인</Link>
                </p>
            </div>
        </div>
    );
}