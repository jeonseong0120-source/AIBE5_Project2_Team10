"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/axios";
import { notifyAuthChanged } from "../lib/authEvents";
import { postLoginPathForRole } from "../lib/postLoginRedirect";

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
                notifyAuthChanged();
                try {
                    const me = await api.get<{ role?: string }>("/v1/users/me");
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
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        window.location.href = `${baseUrl}/oauth2/authorization/google`;
    };

    return (
        <div className="relative bg-white font-sans text-zinc-900 overflow-x-hidden min-h-screen">

            {/* [고정 레이어] 설계도 그리드 & 메쉬 글로우 */}
            <div className="fixed inset-0 z-0 opacity-[0.4]"
                 style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#7A4FFF] opacity-[0.05] blur-[120px] rounded-full z-0"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#FF7D00] opacity-[0.05] blur-[120px] rounded-full z-0"></div>

            {/* [배경 레이어] 코드 데코레이션 */}
            <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none opacity-[0.25] font-mono text-[10px] md:text-[12px] p-6 leading-relaxed">
                <div className="absolute top-[3%] left-[2%] rotate-[-2deg] text-[#FF7D00]">
                    {`@RestController\npublic class MatchingController {\n  @PostMapping("/v1/match/ai")\n  public ResponseEntity<List<Agent>> getOptimalMatch(@RequestBody Request req) {\n    return service.calculate(req.getTags(), req.getLoc());\n  }\n}`}
                </div>
                <div className="absolute top-[8%] right-[5%] rotate-[4deg] text-[#7A4FFF]">
                    {`const useModeSwitch = create((set) => ({\n  mode: 'CLIENT',\n  toggle: () => set((state) => ({ mode: state.mode === 'CLIENT' ? 'FREELANCER' : 'CLIENT' })),\n}));`}
                </div>
                <div className="absolute top-[25%] left-[5%] rotate-[8deg] text-zinc-300">
                    {`-- HYPER-LOCAL SPATIAL SEARCH OPTIMIZATION\nCREATE SPATIAL INDEX idx_user_location ON freelancer_profile(location);\nSELECT * FROM freelancer_profile \nWHERE MBRContains(ST_Buffer(POINT(126.67, 37.59), 5000), location);`}
                </div>
                <div className="absolute top-[35%] right-[2%] rotate-[-10deg] text-[#FF7D00]/50">
                    {`# INFRASTRUCTURE BLUEPRINT\nversion: '3.8'\nservices:\n  redis:\n    image: redis:alpine\n    ports: ["6379:6379"]\n  matching-engine:\n    build: ./ai-model`}
                </div>
                <div className="absolute top-[50%] left-[2%] rotate-[-5deg] text-zinc-200">
                    {`interface AIPromptConfig {\n  model: "gpt-4-turbo";\n  temperature: 0.2;\n  system: "You are a talent matching assistant for DevNear. Find experts with skill similarity > 0.85";\n}`}
                </div>
                <div className="absolute top-[45%] right-[8%] rotate-[12deg] text-[#7A4FFF]/40">
                    {`// WEIGHTED RATING ALGORITHM\nconst finalRating = (allAvg, recentAvg) => {\n  const decayFactor = 0.7;\n  return (allAvg * decayFactor) + (recentAvg * (1 - decayFactor));\n};`}
                </div>
                <div className="absolute bottom-[20%] left-[3%] rotate-[5deg] text-[#FF7D00]/30">
                    {`socket.on("message:send", (data) => {\n  const chat = new ChatEntity(data);\n  repository.save(chat);\n  broadcastTo(data.roomId, chat);\n});`}
                </div>
                <div className="absolute bottom-[35%] right-[5%] rotate-[-8deg] text-zinc-300/40">
                    {`$ git checkout -b feature/pinterest-ui-feed\n$ git commit -m "feat: implement masonry layout for portfolio feed"\n$ git push origin staging`}
                </div>
                <div className="absolute bottom-[5%] left-[15%] rotate-[-2deg] text-[#7A4FFF]/30">
                    {`@Entity\npublic class Review {\n  @Min(1) @Max(5)\n  private Integer quality;\n  @Column(columnDefinition = "TEXT")\n  private String content;\n}`}
                </div>
            </div>

            {/* 🎯 [중앙 로고] */}
            <div className="relative z-20 w-full flex justify-center pt-16">
                <div className="cursor-pointer group" onClick={() => router.push("/")}>
                    <img
                        src="/devnear-logo.png"
                        alt="DevNear_Main_Logo"
                        className="h-50 md:h-50 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                    />
                </div>
            </div>

            {/* [Section 1] Hero & Login */}
            <section className="relative z-10 min-h-[80vh] flex items-center justify-center px-8">
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
                    </div>

                    <div className="bg-white/95 p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[3rem] border border-zinc-100 backdrop-blur-md">
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

            {/* [Section 2] 가치 제안 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8 bg-zinc-50/50">
                <div className="max-w-6xl w-full grid md:grid-cols-2 gap-20 items-center">
                    <div className="font-mono text-sm opacity-40 select-none">
                        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm text-red-400 mb-4">
                            {`// 기존 플랫폼: 키워드 검색의 한계\nconst legacy = platform.search("React 개발자");\n// 결과: 실력 검증 없는 단순 나열...`}
                        </div>
                        <div className="p-6 bg-white border border-[#7A4FFF]/20 rounded-2xl shadow-md text-[#7A4FFF]">
                            {`// DevNear: AI 기반 역량 정밀 매칭\nconst nearTalent = DevNearAI.match({\n  skills: ["React", "Spring Boot"],\n  location: "INCHEON_SEOGU",\n  weight: "QUALITY_FIRST"\n}); // 정밀 매칭 성공!`}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-5xl font-black tracking-tighter">단순한 검색이 아닌,<br/><span className="text-[#7A4FFF]">재능 태그</span> 기반 AI 추천.</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                            기존 직무 중심 카테고리의 한계를 넘어, 세분화된 재능 태그를 기반으로 역량을 정의합니다.
                            사용자가 직접 탐색할 필요 없이 **AI 추천 시스템**이 유사도 분석을 통해 최적의 파트너를 자동으로 도출합니다.
                        </p>
                        <ul className="space-y-2 text-sm font-bold text-zinc-400 uppercase tracking-widest">
                            <li className="flex items-center gap-2"><span className="w-4 h-[1px] bg-[#7A4FFF]"></span> Pinterest-Style Portfolio Feed</li>
                            <li className="flex items-center gap-2"><span className="w-4 h-[1px] bg-[#7A4FFF]"></span> Hyper-Granular Skill Tagging</li>
                            <li className="flex items-center gap-2"><span className="w-4 h-[1px] bg-[#7A4FFF]"></span> AI-Driven Recommendation Engine</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* [Section 3] 지역 기반 매칭 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8 bg-white">
                <div className="max-w-6xl w-full flex flex-col items-center text-center space-y-12">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                        <span className="text-xs font-bold tracking-[0.3em] text-zinc-400 uppercase">Geospatial Hybrid Matching</span>
                        <span className="w-8 h-[2px] bg-[#FF7D00]"></span>
                    </div>
                    <h2 className="text-6xl font-black tracking-tighter">가까운 거리, <br/> 무한한 <span className="text-[#FF7D00]">협업 시너지.</span></h2>
                    <p className="text-zinc-500 text-xl font-medium max-w-2xl leading-relaxed">
                        온라인의 효율과 오프라인의 신뢰를 결합한 **하이브리드 협업** 환경을 제공합니다.
                        인천 서구부터 서울 전역까지, 사용자 활동 지역 설정을 통해 대면 미팅이 가능한 파트너를 1차 필터링하여 매칭의 현실성을 높입니다.
                    </p>
                    <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
                        <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <h3 className="text-2xl font-black mb-4 underline decoration-[#FF7D00] decoration-4 underline-offset-8">오프라인 가용성 필터</h3>
                            <p className="text-zinc-500 leading-relaxed font-medium">프로젝트 등록 시 '오프라인' 협업 방식을 선택하세요. 주소 기반 위치 설정으로 반경 내 인재를 즉시 소집합니다.</p>
                        </div>
                        <div className="p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                            <h3 className="text-2xl font-black mb-4 underline decoration-[#7A4FFF] decoration-4 underline-offset-8">실시간 거리 기반 정렬</h3>
                            <p className="text-zinc-500 leading-relaxed font-medium">단순 지역명이 아닌, 실제 지리 좌표 데이터(GPS)를 기반으로 거리순 정렬을 제공하여 오프라인 접근성을 보장합니다.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* [Section 4] 매칭 로직 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8 bg-zinc-50/50">
                <div className="max-w-5xl w-full text-center space-y-12">
                    <h2 className="text-5xl font-black tracking-tighter">데이터로 검증된 <br /><span className="text-[#FF7D00]">매칭 정밀도</span></h2>
                    <div className="p-12 bg-zinc-950 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-left border border-zinc-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A4FFF] opacity-10 blur-[100px]"></div>
                        <pre className="text-white font-mono text-sm md:text-lg leading-relaxed">
{`// DevNear PROPRIETARY ALGORITHM v1.0.0
const calculateMatchingScore = (agent, project) => {
  const skillMatch = analyzeTagSimilarity(agent.tags, project.requiredTags); // 50%
  const ratingScore = (agent.totalAvg * 0.7) + (agent.recentAvg * 0.3);      // 30%
  const tierWeight = getTierBonus(agent.rank);                             // 20%

  return (skillMatch * 0.5) + (ratingScore * 0.3) + (tierWeight * 0.2);
};`}
                        </pre>
                    </div>
                    <p className="text-zinc-500 text-lg font-medium max-w-2xl mx-auto">
                        최근 프로젝트 평점에 가중치를 두는 **시계열 평점 산정 방식**을 통해 <br />
                        현재 가장 활동적이고 신뢰할 수 있는 요원을 상단에 노출합니다.
                    </p>
                </div>
            </section>

            {/* Section 5: 등급 시스템 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-8">
                <div className="max-w-6xl w-full text-center">
                    <h2 className="text-5xl font-black tracking-tighter mb-4">신뢰 기반의 <span className="text-[#7A4FFF]">등급 에코시스템</span></h2>
                    <p className="text-zinc-400 font-medium italic mb-16">// Rigorous Verification & Tiering Standards</p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "일반 회원", req: "가입 및 기초 인증 완료", color: "bg-zinc-400", desc: "기지 내 모든 공고 탐색 및 기본 활동 권한 부여" },
                            { title: "인증 프리랜서", req: "프로젝트 3건↑ + 평점 4.0↑", color: "bg-[#7A4FFF]", desc: "포트폴리오 검증 완료 및 신뢰 마크 획득 요원" },
                            { title: "TOP Talent", req: "프로젝트 10건↑ + 리뷰 20개↑", color: "bg-[#FF7D00]", desc: "평균 평점 4.5 이상 유지 중인 기지 최상위 마스터" },
                        ].map((tier, idx) => (
                            <div key={idx} className="bg-white p-12 rounded-[3rem] border border-zinc-100 shadow-xl hover:shadow-2xl transition-all border-b-8 hover:-translate-y-2">
                                <div className={`w-16 h-1.5 ${tier.color} mb-8 rounded-full`}></div>
                                <h3 className="text-2xl font-black mb-3">{tier.title}</h3>
                                <p className="text-xs font-bold text-[#7A4FFF] uppercase tracking-tighter mb-6">{tier.req}</p>
                                <p className="text-zinc-500 font-medium leading-relaxed">{tier.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative z-10 py-32 px-8 text-center bg-zinc-950">
                <div className="max-w-4xl mx-auto space-y-10 text-zinc-100">
                    <h2 className="text-6xl font-black tracking-tighter">
                        당신의 <span className="text-[#FF7D00]">재능</span>에 <br/>
                        가장 타당한 자리를.
                    </h2>
                    <p className="text-zinc-400 text-xl font-medium">
                        재능 있는 파트너들이 지금 마스터의 합류를 기다리고 있습니다.
                    </p>
                    <div className="pt-8">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-12 py-6 bg-white text-black rounded-full font-black text-xl hover:bg-[#7A4FFF] hover:text-white transition-all shadow-[0_0_50px_rgba(122,79,255,0.3)]">
                            DEVNEAR 기지 접속하기
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}