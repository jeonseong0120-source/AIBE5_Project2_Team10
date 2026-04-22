"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./lib/axios";
import { postLoginPathForRole } from "./lib/postLoginRedirect";
import { Zap, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get("/v1/users/me");
        const role = res.data.role;
        const next = postLoginPathForRole(role);
        if (next !== "/") {
          router.replace(next);
          return;
        }
        setUser(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    checkUser();
  }, [router]);

  if (loading) return (
      <div className="flex min-h-screen items-center justify-center bg-white font-black text-[#FF7D00] text-xl animate-pulse">
        {`// SYSTEM_SCANNING_IN_PROGRESS...`}
      </div>
  );

  return (
      <div className="relative min-h-screen bg-white font-sans text-zinc-900 overflow-x-hidden selection:bg-[#7A4FFF]/30">

        {/* 🌌 [배경] 설계도 그리드 & 글로우 이펙트 */}
        <div className="fixed inset-0 z-0 opacity-[0.3]"
             style={{ backgroundImage: 'linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        <div className="fixed top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#7A4FFF] opacity-[0.08] blur-[150px] rounded-full z-0"></div>
        <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FF7D00] opacity-[0.08] blur-[150px] rounded-full z-0"></div>

        {/* 🚀 히어로 섹션 (네비게이션 없이 바로 시작) */}
        <section className="relative z-10 pt-32 pb-32 px-6 flex flex-col items-center">

          {/* 중앙 로고 배치 (헤더 대신 존재감 부여) */}
          <div className="mb-12 cursor-pointer" onClick={() => router.push("/")}>
            <img src="/devnear-logo.png" alt="Logo" className="h-46 w-auto" />
          </div>

          {/* 🎯 TS2339 수정: div로 교체 */}
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-10 bg-zinc-50 border border-zinc-100 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7D00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF7D00]"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Mission: Connecting Excellence</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-center mb-10 leading-[0.95]">
            가장 가까운 곳의<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7D00] via-[#7A4FFF] to-[#FF7D00] bg-[length:200%_auto] animate-gradient-x">프리랜서</span>을 소집하라.
          </h1>

          <p className="max-w-2xl text-center text-zinc-500 text-lg md:text-xl font-medium mb-16 leading-relaxed">
            무의미한 검색은 끝났습니다. AI 정밀 매칭 알고리즘과 하이퍼-로컬 위치 엔진이<br />
            당신의 프로젝트에 가장 타당한 파트너를 0.1초 만에 찾아냅니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg justify-center mb-32">
            <button onClick={() => router.push("/login")} className="group relative flex-1 h-20 bg-zinc-950 text-white rounded-[2rem] font-black text-xl overflow-hidden shadow-2xl transition-all active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                기지 접속하기 <ArrowRight size={20} />
              </span>
            </button>
          </div>

          {/* 💻 프로덕트 프리뷰 */}
          <div className="relative w-full max-w-5xl mx-auto px-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF] rounded-[3rem] blur opacity-20"></div>
            <div className="relative bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-100" />
                  <div className="w-3 h-3 rounded-full bg-amber-100" />
                  <div className="w-3 h-3 rounded-full bg-green-100" />
                </div>
                <div className="px-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                  ai_matching_engine_v1.0
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <div className="w-12 h-12 bg-[#7A4FFF] rounded-2xl flex items-center justify-center text-white font-black">JS</div>
                    <div>
                      <p className="text-sm font-black text-zinc-900 leading-none mb-1">전성 (Jeon Seong)</p>
                      <p className="text-[10px] text-[#7A4FFF] font-bold uppercase">Backend Specialist</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-black text-[#FF7D00]">98%</p>
                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">Match</p>
                    </div>
                  </div>
                  <div className="border-l-4 border-[#FF7D00] bg-orange-50/50 p-6 rounded-r-3xl space-y-2">
                    <p className="text-[10px] font-black uppercase text-[#FF7D00] tracking-widest">AI Analysis Report</p>
                    <p className="text-sm font-bold text-zinc-700 leading-relaxed">마스터의 요구 스킬인 Spring Boot와 Figma 역량을 모두 갖춘 프리랜서입니다. 반경 2km 이내에 거주하여 긴급 오프라인 협업이 가능합니다.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-black tracking-tight leading-tight">데이터로 증명하는<br />압도적 신뢰도.</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">단순한 검색 결과가 아닙니다. 프로젝트의 지리적 위치, 기술 유사도, 과거 평점 데이터를 종합하여 가장 성공 확률이 높은 매칭 리스트를 생성합니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🛠️ 특장점 섹션 */}
        <section className="relative z-10 py-40 px-6 bg-zinc-50/50 border-y border-zinc-100">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
            {[
              { icon: <MapPin />, title: "Hyper-Local", desc: "인천 서구부터 강남까지, 실제 대면 미팅이 가능한 반경 내 인재를 거리순으로 소집합니다." },
              { icon: <Zap />, title: "AI-Driven", desc: "단순 직무가 아닌 촘촘한 기술 태그 기반의 유사도 분석으로 노이즈 없는 매칭을 보장합니다." },
              { icon: <ShieldCheck />, title: "Verified Base", desc: "검증된 포트폴리오와 실제 협업 평점을 바탕으로 한 등급 시스템으로 먹튀 걱정 없는 기지를 구축합니다." }
            ].map((item, idx) => (
                <div key={idx} className="bg-white p-12 rounded-[3rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                  <div className="w-14 h-14 bg-zinc-50 text-zinc-900 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FF7D00] group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{item.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
            ))}
          </div>
        </section>

        <footer className="relative z-10 py-20 border-t border-zinc-100 text-center">
          <div className="text-xl font-black tracking-tighter mb-6 opacity-30">
            <span className="text-[#FF7D00]">Dev</span><span className="text-[#7A4FFF]">Near</span>
          </div>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.3em] font-mono">
            &copy; 2026 Base_Command_Center. Access_Granted.
          </p>
        </footer>
      </div>
  );
}