"use client";

import { useState, useEffect, useRef } from "react"; // 🎯 useRef, useEffect 추가
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Mail, Lock, ArrowRight } from "lucide-react";
import api, { resolveApiBaseUrl } from '@/app/lib/axios'; // 🎯 resolveApiBaseUrl 임포트
import { notifyAuthChanged } from "@/app/lib/authEvents";
import { postLoginPathForRole } from "@/app/lib/postLoginRedirect";

const overlayVariant: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
};

const modalVariant: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", damping: 25, stiffness: 350 }
    },
};

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();
    const modalRef = useRef<HTMLDivElement>(null); // 🎯 포커스 관리를 위한 Ref
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 🎯 [추가] ESC 키 핸들러 및 포커스 트랩 기초 설정
    useEffect(() => {
        if (isOpen) {
            // 모달 열릴 때 내부로 포커스 이동
            modalRef.current?.focus();

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            window.addEventListener("keydown", handleKeyDown);

            // 스크롤 방지 (선택 사항이나 권장됨)
            document.body.style.overflow = "hidden";

            return () => {
                window.removeEventListener("keydown", handleKeyDown);
                document.body.style.overflow = "unset";
            };
        }
    }, [isOpen, onClose]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken } = res.data;
            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
                notifyAuthChanged();
                try {
                    const me = await api.get<{ role?: string }>("/v1/users/me");
                    onClose();
                    router.replace(postLoginPathForRole(me.data.role));
                } catch {
                    router.replace("/");
                }
            }
        } catch (err: any) {
            alert("이메일 또는 비밀번호를 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // 🎯 [수정] 하드코딩된 fallback 대신 공통 resolver 사용
        const baseUrl = resolveApiBaseUrl();
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={overlayVariant}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                    // 🎯 [추가] 다이얼로그 시맨틱 적용
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
                >
                    <motion.div
                        ref={modalRef}
                        variants={modalVariant}
                        // 🎯 [추가] 접근성 속성: 제목 연결 및 포커스 가능하게 설정
                        tabIndex={-1}
                        aria-labelledby="modal-title"
                        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative outline-none"
                    >
                        {/* 상단 액센트 바 */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF]" />

                        <button
                            onClick={onClose}
                            aria-label="Close" // 🎯 [추가] 닫기 버튼 레이블
                            className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 md:p-10">
                            <div className="text-center mb-8">
                                <img src="/devnear-logo.png" alt="Logo" className="h-7 mx-auto mb-5" />
                                {/* 🎯 id 부여하여 aria-labelledby와 연결 */}
                                <h3 id="modal-title" className="text-2xl font-black text-zinc-900 tracking-tight">서비스 접속</h3>
                                <p className="text-sm text-zinc-500 font-medium mt-1">자격 증명을 입력하고 기지에 연결하세요.</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF7D00] transition-colors" size={16} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-11 py-4 text-sm font-bold focus:ring-2 focus:ring-[#FF7D00]/10 focus:border-[#FF7D00] outline-none transition-all placeholder:font-normal"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#7A4FFF] transition-colors" size={16} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-11 py-4 text-sm font-bold focus:ring-2 focus:ring-[#7A4FFF]/10 focus:border-[#7A4FFF] outline-none transition-all placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-zinc-950 text-white h-14 rounded-2xl font-black shadow-lg hover:shadow-[#7A4FFF]/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? "연결 중..." : "시스템 접속"}
                                    {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </form>

                            <div className="relative my-8 text-center">
                                <span className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></span>
                                <span className="relative bg-white px-4 text-[10px] font-black text-zinc-300 uppercase tracking-widest">Or login with</span>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full border border-zinc-100 h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-50 transition-colors font-bold text-zinc-600 text-sm shadow-sm"
                            >
                                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                                Google 계정으로 계속
                            </button>

                            <div className="mt-8 pt-6 border-t border-zinc-50 text-center">
                                <p className="text-xs text-zinc-400 font-medium mb-3">아직 정식 요원이 아니신가요?</p>
                                <button
                                    onClick={() => { onClose(); router.push("/signup"); }}
                                    className="px-6 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black hover:bg-zinc-100 transition-colors shadow-inner"
                                >
                                    신규 등록(회원가입)
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}