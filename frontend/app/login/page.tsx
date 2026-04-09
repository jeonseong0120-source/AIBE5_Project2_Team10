"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken } = res.data;
            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
                router.push("/");
            }
        } catch (err: any) {
            alert("이메일 또는 비밀번호를 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    // [수정] 배포 환경을 고려하여 .env.local의 API 주소를 사용하도록 수정
    const handleGoogleLogin = () => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div className="relative bg-white font-sans text-zinc-900 overflow-x-hidden">

            {/* [고정 레이어] 설계도 그리드 & 메쉬 글로우 */}
            <div className="fixed inset-0 z-0 opacity-[0.4]"
                 style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#7A4FFF] opacity-[0.05] blur-[120px] rounded-full z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#FF7D00] opacity-[0.05] blur-[120px] rounded-full z-0"></div>
            {/* [배경 레이어 3] 마스터가 좋아하시는 코드 데코레이션 (전체 섹션에 걸쳐 배치) */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none opacity-[0.12] font-mono text-[11px] md:text-[14px] p-10 leading-relaxed">
                <div className="absolute top-[15%] left-[5%] rotate-[-3deg] text-[#FF7D00]">
                    {`@RestController\npublic class AuthController {\n  @PostMapping("/login")\n  public ResponseEntity<?> login() { ... }\n}`}
                </div>
                <div className="absolute bottom-[10%] left-[8%] rotate-[4deg] text-[#7A4FFF]">
                    {`const { user } = useAuth();\nuseEffect(() => {\n  console.log("Welcome Master Jeonseong");\n}, [user]);`}
                </div>
                <div className="absolute top-[45%] left-[2%] rotate-[10deg] text-zinc-300">
                    {`SELECT name, role FROM developers\nWHERE location = 'SEOUL_GU'\nORDER BY rating DESC;`}
                </div>
                <div className="absolute top-[10%] right-[15%] rotate-[-8deg] text-[#FF7D00]">
                    {`# Docker Compose\nservices:\n  backend:\n    image: devnear-api:latest\n    ports: ["8080:8080"]`}
                </div>
                <div className="absolute bottom-[35%] right-[12%] rotate-[-15deg] text-[#7A4FFF]">
                    {`$ git checkout -b feature/matching-logic\n$ git commit -m "feat: AI scoring v1"\n$ git push origin main`}
                </div>
                <div className="absolute top-[70%] left-[15%] rotate-[-5deg] text-zinc-200">
                    {`interface MatchingScore {\n  skillMatch: number;\n  locationWeight: number;\n  finalScore: number;\n}`}
                </div>
            </div>

            {/* [상단 네비게이션] 블랙 배경 - 고정 */}
            <nav className="w-full py-5 px-10 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center fixed top-0 left-0 z-50">
                <div className="font-black text-2xl tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
                    <span className="text-[#FF7D00]">Dev</span>
                    <span className="text-[#7A4FFF]">Near</span>
                </div>
                <div className="flex gap-6 items-center">
                    <Link href="/signup" className="text-white/70 text-sm font-bold hover:text-white transition-colors">Join Agent</Link>
                </div>
            </nav>

            {/* [Section 1] Hero & Login 카드 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center pt-20 px-8">
                <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                            <span className="text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">System Authorization</span>
                        </div>
                        <h1 className="text-7xl font-black leading-tight tracking-tighter">
                            Code with <br />
                            <span className="text-[#FF7D00]">Passion,</span> <br />
                            Stay <span className="text-[#7A4FFF]">Connected.</span>
                        </h1>
                        <p className="text-zinc-500 text-xl font-medium max-w-md leading-relaxed">
                            재능과 지역을 잇는 가장 타당한 방법. <br />
                            지금 기지에 접속하여 우산을 펼치세요.
                        </p>
                        <div className="pt-4 flex items-center gap-4 text-zinc-400 animate-bounce">
                            <span className="text-sm font-bold uppercase tracking-widest">Scroll to view blueprint</span>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 14l-7 7-7-7m14-8l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    <div className="bg-white/95 p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[3rem] border border-zinc-100">
                        <h2 className="text-3xl font-bold mb-2 tracking-tight">로그인</h2>
                        <form onSubmit={handleLogin} className="space-y-5 mt-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email ID</label>
                                <input type="email" placeholder="example@devnear.com" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                                <input type="password" placeholder="••••••••" className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#7A4FFF] outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] transition-all shadow-xl active:scale-95 disabled:bg-zinc-200">
                                {loading ? "접속 중..." : "기지 접속하기"}
                            </button>
                        </form>
                        <div className="relative my-10">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-100"></span></div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-4 text-zinc-300 font-bold">OR</span></div>
                        </div>
                        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 border border-zinc-100 p-4 rounded-2xl hover:bg-zinc-50 transition-all font-bold text-zinc-600">
                            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
                            Google 계정 로그인
                        </button>
                    </div>
                </div>
            </section>

            {/* [Section 2] 가치 제안: 기존 플랫폼의 한계 해결 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8 bg-zinc-50/50">
                <div className="max-w-6xl w-full grid md:grid-cols-2 gap-20 items-center">
                    <div className="font-mono text-sm opacity-40 select-none">
                        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-red-400 mb-4">
                            {`// AS-IS: 기존의 비효율\nconst matching = legacySearch(\n  category: "JOB_TITLE",\n  method: "KEYWORD_ONLY"\n); // 불명확한 실력 검증...`}
                        </div>
                        <div className="p-6 bg-white border border-[#7A4FFF]/20 rounded-2xl shadow-md text-[#7A4FFF]">
                            {`// TO-BE: DevNear의 타당한 연결\nconst agent = DevNearAI.match({\n  skillTags: ["React", "Java"],\n  location: "Seoul/Seo-gu",\n  trustLevel: "TOP_TALENT"\n}); // 정밀 매칭 성공!`}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-5xl font-black tracking-tighter">단순한 검색이 아닌,<br/><span className="text-[#7A4FFF]">데이터 기반</span>의 추천.</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                            기존 직무 중심의 검색 방식은 회원님 세분화된 재능을 담지 못합니다.
                            DevNear는 재능 태그와 지역 정보를 결합해 온/오프라인을 아우르는 최적의 프리랜서/클라이언트를 찾아냅니다.
                        </p>
                        <div className="flex gap-6 pt-4">
                            <div className="flex flex-col"><span className="text-3xl font-black text-[#FF7D00]">98%</span><span className="text-xs font-bold text-zinc-400 uppercase">Match Rate</span></div>
                            <div className="flex flex-col"><span className="text-3xl font-black text-[#7A4FFF]">AI</span><span className="text-xs font-bold text-zinc-400 uppercase">Scoring</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* [Section 3] 핵심 로직: AI 매칭 스코어링 (기획안 6.4 반영) */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8">
                <div className="max-w-4xl w-full text-center space-y-12">
                    <h2 className="text-5xl font-black tracking-tighter">타당한 <span className="text-[#FF7D00]">매칭 점수</span> 산정 방식</h2>
                    <div className="p-10 bg-zinc-950 rounded-[3rem] shadow-2xl relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF7D00] to-[#7A4FFF] opacity-20 blur-3xl"></div>
                        <code className="text-[#7A4FFF] block mb-4 text-xs font-bold tracking-widest">// ALGORITHM_V1_SCORE_LOGIC</code>
                        <pre className="text-white font-mono text-sm md:text-lg leading-relaxed overflow-x-auto">
{`const calculateFinalRating = (totalAvg, recentAvg) => {
  // 최근 프로젝트에 더 높은 가중치를 부여합니다.
  return (totalAvg * 0.7) + (recentAvg * 0.3);
};

const matchingScore = (tags, rating, tier) => {
  return (tagMatchRate * 0.5) + (rating * 0.3) + (tierWeight * 0.2);
};`}
                        </pre>
                    </div>
                    <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">
                        DevNear는 최근 성과에 가중치를 두어
                        활동적인 고숙련 프리랜서를 가장 타당하게 추천합니다.
                    </p>
                </div>
            </section>

            {/* [Section 4] 등급 시스템 (기획안 6.2 반영) */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8 bg-zinc-50/50">
                <div className="max-w-6xl w-full">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black tracking-tighter mb-4">검증된 회원 <span className="text-[#7A4FFF]">등급 시스템</span></h2>
                        <p className="text-zinc-400 font-medium italic">// Verification & Tier Blueprint</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            // [수정] Tailwind CSS에서 동적 클래스(`bg-${color}`)를 쓰면 빌드 시 색상이 날아가는 버그 수정
                            // 전체 클래스명("bg-zinc-400" 등)을 온전히 적어주어야 PurgeCSS가 인식하고 남겨둠
                            { title: "일반 회원", req: "가입 완료", color: "bg-zinc-400", desc: "기지 활동의 시작" },
                            { title: "인증 프리랜서", req: "완료 3건 + 평점 4.0↑", color: "bg-[#7A4FFF]", desc: "신뢰받는 검증 회원" },
                            { title: "TOP Talent", req: "완료 10건 + 평점 4.5↑", color: "bg-[#FF7D00]", desc: "기지 최상위 능력자" },
                        ].map((tier, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-lg hover:-translate-y-2 transition-transform">
                                <div className={`w-12 h-1 ${tier.color} mb-6`}></div>
                                <h3 className="text-2xl font-black mb-2">{tier.title}</h3>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Requirements: {tier.req}</p>
                                <p className="text-zinc-500 font-medium">{tier.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* [Section 5] Final CTA */}
            <section className="relative z-10 py-32 px-8 text-center bg-zinc-950">
                <div className="max-w-4xl mx-auto space-y-10">
                    <h2 className="text-6xl font-black tracking-tighter text-white">
                        지금, 당신의 <span className="text-[#FF7D00]">Blueprint</span>를 <br/>
                        현실로 만드세요.
                    </h2>
                    <p className="text-zinc-400 text-xl font-medium">
                        재능 있는 회원들이 당신의 합류를 기다리고 있습니다.
                    </p>
                    <div className="pt-8">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:bg-[#7A4FFF] hover:text-white transition-all shadow-2xl"
                        >
                            devnear에 접속하여 누리기
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}