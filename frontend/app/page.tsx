"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "./lib/axios";
import { postLoginPathForRole } from "./lib/postLoginRedirect";
import {
  Zap, MapPin, ShieldCheck, ArrowRight, Search, Layers, CheckCircle2,
  Star, MessageSquare, BarChart3, Lock, Cpu, Code2,
  Network, Wand2, Sparkles, Binary, Terminal, Database, Workflow, BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type SimState = "idle" | "loading" | "result";

interface UserData {
  role: string;
  [key: string]: unknown;
}

// ─── Animation Variants (Impactful & Premium Spring Physics) ──────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, type: "spring", stiffness: 80, damping: 15, mass: 1 },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 90, damping: 15 },
  },
};

const particleVariant: Variants = {
  animate: {
    y: [0, -80, 0],
    x: [0, 20, -20, 0],
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.5, 0.8],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FloatingCard({
                        side,
                        delay,
                        avatarBg,
                        avatarColor,
                        initials,
                        title,
                        subtitle,
                        subtitleColor,
                      }: {
  side: "left" | "right";
  delay: number;
  avatarBg: string;
  avatarColor: string;
  initials: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
}) {
  const yValues = side === "left" ? [0, -30, 0] : [0, 30, 0];
  const posClass = side === "left"
      ? "absolute top-[20%] left-[5%]"
      : "absolute bottom-[20%] right-[8%]";

  return (
      <motion.div
          initial={{ opacity: 0, scale: 0.8, x: side === "left" ? -50 : 50 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: yValues }}
          transition={{
            opacity: { delay, duration: 0.8 },
            scale: { delay, duration: 0.8 },
            x: { delay, duration: 0.8, type: "spring" },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }
          }}
          className={`${posClass} bg-white/90 backdrop-blur-xl px-6 py-5 rounded-3xl shadow-2xl border border-zinc-100/80 flex items-center gap-5 z-10 hover:scale-110 transition-transform cursor-default`}
      >
        <div className={`w-12 h-12 ${avatarBg} rounded-2xl flex items-center justify-center ${avatarColor} font-black text-base shadow-inner`}>
          {initials}
        </div>
        <div>
          <p className="text-base font-black text-zinc-900 leading-none mb-1.5">{title}</p>
          <p className={`text-xs ${subtitleColor} font-bold tracking-wide`}>{subtitle}</p>
        </div>
      </motion.div>
  );
}

function LightAmbientParticles() {
  return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                variants={particleVariant}
                animate="animate"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`
                }}
                className={`absolute rounded-full blur-[2px] ${i % 2 === 0 ? 'w-2 h-2 bg-[#FF7D00]' : 'w-3 h-3 bg-[#7A4FFF]'}`}
            />
        ))}
      </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ onCTA }: { onCTA: () => void }) {
  return (
      <section className="relative z-10 pt-28 pb-36 px-6 flex flex-col items-center min-h-[96vh] justify-center overflow-hidden">
        <LightAmbientParticles />

        {/* Floating cards */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden lg:block">
          <FloatingCard
              side="left"
              delay={0.2}
              avatarBg="bg-gradient-to-br from-orange-100 to-amber-50"
              avatarColor="text-[#FF7D00]"
              initials="BE"
              title="Backend 전문가"
              subtitle="1.2km 이내 · 오프라인 가능"
              subtitleColor="text-zinc-500"
          />
          <FloatingCard
              side="right"
              delay={0.4}
              avatarBg="bg-gradient-to-br from-violet-100 to-purple-50"
              avatarColor="text-[#7A4FFF]"
              initials="UI"
              title="#React #Figma"
              subtitle="TOP Talent 매칭"
              subtitleColor="text-[#7A4FFF]"
          />
        </div>

        {/* Logo */}
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-12 cursor-pointer z-20 hover:scale-105 transition-transform duration-300"
            onClick={onCTA}
        >
          <img src="/devnear-logo.png" alt="DevNear Logo" className="h-26 md:h-40 w-auto drop-shadow-2xl" />
        </motion.div>

        {/* Status badge */}
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="relative z-20 inline-flex items-center gap-3 px-6 py-2.5 mb-8 bg-white border border-zinc-200 shadow-lg rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7D00] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7D00]" />
        </span>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600">
          The Next-Gen Hybrid Matching Platform
        </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="relative z-20 text-6xl md:text-[6.15rem] font-black tracking-tighter text-center mb-10 leading-[1.05]"
        >
          거리와 재능을 연결하는
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7D00] via-[#7A4FFF] to-[#FF7D00] bg-[length:100%_auto] animate-[gradient_4s_linear_infinite]">
          가장 완벽한
        </span>{" "}
          시스템.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="relative z-20 max-w-2xl text-center text-zinc-500 text-xl font-medium mb-14 leading-relaxed"
        >
          세분화된 <strong className="text-zinc-800">기술 태그</strong>와{" "}
          <strong className="text-zinc-800">지역 필터링(온/오프라인)</strong>을 결합하여,
          <br className="hidden md:block" />
          프로젝트에 가장 타당한 파트너를 즉시 연결합니다.
        </motion.p>

        {/* CTA Bar */}
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
            className="relative z-20 w-full max-w-3xl bg-white/80 backdrop-blur-3xl p-3 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white flex flex-col md:flex-row items-center gap-3 group"
        >
          <div className="flex-1 w-full bg-white rounded-full px-6 py-4 flex items-center gap-4 border border-zinc-200/60 shadow-inner group-hover:border-zinc-300 transition-colors duration-300">
            <Search size={20} className="text-zinc-400 shrink-0 group-hover:text-[#FF7D00] transition-colors duration-300" />
            <input
                type="text"
                placeholder="어떤 재능이 필요하신가요? (ex. 리액트, 스프링부트)"
                className="w-full bg-transparent outline-none text-base font-bold text-zinc-700 placeholder:text-zinc-400 placeholder:font-medium"
                disabled
            />
          </div>
          <button
              onClick={onCTA}
              className="w-full md:w-auto px-10 py-4 bg-zinc-950 text-white rounded-full font-black text-base hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] active:scale-[0.96] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl whitespace-nowrap"
          >
            서비스 접속하기 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>
  );
}

// ─── Simulator Section ────────────────────────────────────────────────────────

function SimulatorSection() {
  const [simState, setSimState] = useState<SimState>("idle");

  const handleSimulation = useCallback(() => {
    if (simState !== "idle") return;
    setSimState("loading");
    setTimeout(() => setSimState("result"), 1800);
  }, [simState]);

  const resetSim = useCallback(() => setSimState("idle"), []);

  return (
      <section className="relative z-10 py-32 px-6 bg-white border-t border-zinc-100/80">
        <div className="max-w-6xl mx-auto">
          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true, margin: "-40px" }}
              className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FF7D00] mb-4">
                Interactive Engine Demo
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-zinc-900">
                Hyper-Local Simulator
              </h2>
              <p className="text-zinc-500 font-medium text-lg max-w-lg">
                단순 검색이 아닌, 실시간 거리 연산 기반의 알고리즘 매칭을 직접 체험하세요.
              </p>
            </div>
          </motion.div>

          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} custom={0.1} viewport={{ once: true, margin: "-40px" }}
              className="bg-zinc-50/80 rounded-[3rem] p-6 md:p-12 border border-zinc-200/80 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
              {/* Input Panel */}
              <div className="lg:col-span-5 space-y-6 bg-white p-8 md:p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl hover:shadow-2xl transition-shadow duration-500">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">
                      Required Skills
                    </label>
                    <div className="flex gap-2.5 flex-wrap">
                      {["Spring Boot", "React", "MySQL"].map((skill) => (
                          <motion.span
                              whileHover={{ scale: 1.05, backgroundColor: "#FF7D00", color: "#fff", borderColor: "#FF7D00" }}
                              key={skill}
                              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 transition-colors cursor-default"
                          >
                            {skill}
                          </motion.span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">
                      Location Mode
                    </label>
                    <div className="flex items-center gap-3 px-5 py-4 bg-orange-50 border border-orange-100 rounded-2xl w-full group/loc hover:bg-orange-100 transition-colors cursor-default">
                      <MapPin size={18} className="text-[#FF7D00] shrink-0 group-hover/loc:animate-bounce" />
                      <span className="text-sm font-black text-[#FF7D00]">
                      서울특별시 한강대로 229 (오프라인)
                    </span>
                    </div>
                  </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={simState === "result" ? resetSim : handleSimulation}
                    disabled={simState === "loading"}
                    className="w-full h-16 mt-4 bg-zinc-950 text-white rounded-2xl font-black shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:bg-[#7A4FFF] hover:shadow-[0_10px_30px_-10px_rgba(122,79,255,0.6)] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {simState === "idle" && (
                      <>
                        <Zap size={18} /> 매칭 엔진 가동
                      </>
                  )}
                  {simState === "loading" && (
                      <span className="flex items-center gap-2">
                    <MapPin size={18} className="animate-bounce" /> AI 엔진 스캔 중...
                  </span>
                  )}
                  {simState === "result" && (
                      <>
                        <CheckCircle2 size={18} /> 초기화
                      </>
                  )}
                </motion.button>
              </div>

              {/* Output Panel */}
              <div className="lg:col-span-7 relative min-h-[350px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {simState === "idle" && (
                      <motion.div
                          key="idle"
                          variants={scaleIn}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="text-center"
                      >
                        <Terminal size={56} className="text-zinc-200 mx-auto mb-5" />
                        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest font-bold">
                          Awaiting input parameters...
                        </p>
                      </motion.div>
                  )}

                  {simState === "loading" && (
                      <motion.div
                          key="loading"
                          variants={scaleIn}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="relative w-48 h-48"
                      >
                        <div className="absolute inset-0 border-4 border-[#7A4FFF]/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin" style={{ animationDuration: "1s" }} />
                        <div className="absolute inset-4 border-4 border-[#7A4FFF]/30 border-b-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Network className="text-[#7A4FFF] animate-pulse" size={36} />
                        </div>
                      </motion.div>
                  )}

                  {simState === "result" && (
                      <motion.div
                          key="result"
                          variants={slideInRight}
                          initial="hidden"
                          animate="visible"
                          className="w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-zinc-100 hover:shadow-[0_30px_60px_-15px_rgba(255,125,0,0.15)] transition-shadow duration-500"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ rotate: -90, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                                className="w-16 h-16 bg-gradient-to-br from-[#FF7D00] to-[#7A4FFF] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg"
                            >
                              D
                            </motion.div>
                            <div>
                              <h4 className="font-black text-xl text-zinc-900 leading-none mb-2">
                                전성 (Jeon Seong)
                              </h4>
                              <p className="text-xs text-[#7A4FFF] font-black flex items-center gap-1.5 bg-[#7A4FFF]/10 px-2 py-1 rounded-md w-fit">
                                <ShieldCheck size={12} /> TOP Talent · 4.9
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <motion.p
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="text-4xl font-black text-[#FF7D00]"
                            >
                              98%
                            </motion.p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mt-1">
                              Match Score
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-100 pb-6">
                          {["Spring Boot", "React", "MySQL"].map((t, i) => (
                              <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.4 + i * 0.1 }}
                                  key={t}
                                  className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold"
                              >
                                {t}
                              </motion.span>
                          ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="border-l-4 border-[#FF7D00] bg-gradient-to-r from-orange-50/80 to-transparent p-5 rounded-r-2xl"
                        >
                          <p className="text-sm font-bold text-zinc-800 leading-relaxed break-keep">
                            요구 스킬과 완벽히 일치하며 평점이 검증된 마스터급 프리랜서입니다.{" "}
                            <strong className="text-[#FF7D00]">반경 1.5km 내 거주</strong>하여
                            실시간 오프라인 협업에 최적화되어 있습니다.
                          </p>
                        </motion.div>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  );
}

// ─── Rule Engine Section ──────────────────────────────────────────────────────

const troubleshootingItems = [
  {
    icon: <MapPin size={18} />,
    title: "초정밀 공간 연산 최적화",
    desc: "Hibernate의 ST_Distance_Sphere 연산 로직에서 발생하는 병목과 타입 오류를 해결하고 오프라인 분기 처리 완비.",
  },
  {
    icon: <CheckCircle2 size={18} />,
    title: "결정론적 안정 정렬 (Stable Sort)",
    desc: "매칭 점수가 동일한 0점 유저 간의 무작위 렌더링을 막기 위해 성실도 보너스와 ID 기반 정렬 아키텍처 도입.",
  },
];

function RuleEngineSection() {
  return (
      <section className="relative z-10 py-32 px-6 bg-zinc-950 text-white overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500 opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true, margin: "-40px" }}
              className="mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-white/5 border border-white/10 rounded-full shadow-lg">
              <Database size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Rule-Based Deterministic Engine
            </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-5 leading-tight">
              정밀하게 설계된{" "}
              <span className="text-emerald-400">결정론적</span> 스코어링.
            </h2>
            <p className="text-zinc-400 font-medium text-lg max-w-2xl leading-relaxed">
              클라이언트를 위한 매칭은 철저히 증명된 데이터베이스 기반의 규칙 엔진으로 동작합니다. 투명하고 타당한 결과를 보장합니다.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Scoring formula */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true, margin: "-80px" }}
                className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Cpu className="text-emerald-400" size={22} /> Scoring Formula
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono bg-black/50 px-3 py-1 rounded-md border border-white/10">
                math.ts
              </span>
              </div>

              <div className="bg-[#080808] rounded-2xl p-7 border border-white/5 mb-8 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] overflow-x-auto relative z-10 group-hover:border-white/10 transition-colors">
                <code className="text-sm font-mono text-zinc-400 block leading-8">
                  <span className="text-emerald-400 font-bold">TotalScore</span> ={" "}
                  <br />
                  <span className="pl-4" />( <span className="text-white">S_match</span> × 0.5 ){" "}
                  <span className="text-zinc-600">// 스킬 적합도</span>
                  <br />
                  <span className="pl-4" />+ ( <span className="text-white">R_score</span> × 0.3 ){" "}
                  <span className="text-zinc-600">// 신뢰도 평점</span>
                  <br />
                  <span className="pl-4" />+ ( <span className="text-white">E_score</span> × 0.2 ){" "}
                  <span className="text-zinc-600">// 숙련도(완료 수)</span>
                  <br />
                  <span className="pl-4" />+ <span className="text-[#FF7D00]">B_comp</span>
                  {"            "}
                  <span className="text-zinc-600">// 성실도 보너스</span>
                </code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                산출된 점수를 바탕으로{" "}
                <strong className="text-white">지능형 코멘트(Explainable AI)</strong>를 생성하여
                클라이언트에게 매칭 근거를 제시합니다.
              </p>
            </motion.div>

            {/* Troubleshooting archive */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                variants={staggerContainer}
                viewport={{ once: true, margin: "-80px" }}
                className="flex flex-col justify-center space-y-5"
            >
              <motion.h3 variants={fadeUp} className="text-2xl font-black text-white mb-4">
                엔지니어링 트러블슈팅 아카이브
              </motion.h3>
              {troubleshootingItems.map((item, idx) => (
                  <motion.div
                      variants={fadeUp}
                      key={idx}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 p-7 rounded-3xl flex items-start gap-5 hover:bg-white/10 hover:-translate-y-1.5 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] transition-all duration-300 cursor-default group"
                  >
                    <div className="text-zinc-400 mt-1 bg-black/50 p-3 rounded-2xl border border-white/10 shrink-0 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white text-base font-black mb-2 group-hover:text-emerald-50 transition-colors">{item.title}</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
  );
}

// ─── AI Section ───────────────────────────────────────────────────────────────

function AISection() {
  return (
      <section className="relative z-10 py-32 px-6 bg-zinc-950 text-white overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-[#7A4FFF] opacity-[0.05] blur-[180px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true, margin: "-40px" }}
              className="text-center max-w-3xl mx-auto mb-24"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 bg-[#7A4FFF]/10 border border-[#7A4FFF]/20 rounded-full shadow-[0_0_20px_rgba(122,79,255,0.2)]">
              <BrainCircuit size={14} className="text-[#7A4FFF]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7A4FFF]">
              Semantic Generative AI
            </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
              규칙을 넘어선 의미론적 도약.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF] animate-[gradient_4s_linear_infinite] bg-[length:200%_auto]">
              Gemini Powered Architecture.
            </span>
            </h2>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
              클라이언트의 의도를 이해하는 자연어 처리부터 프리랜서를 위한 다차원 벡터 추천까지.
              생성형 AI가 결합된 DevNear의 초개인화 엔진을 소개합니다.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true, margin: "-80px" }}
                className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 relative overflow-hidden group hover:border-white/20 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(255,125,0,0.1)] hover:-translate-y-2"
            >
              <div className="absolute -top-12 -right-12 opacity-[0.03] rotate-12 group-hover:rotate-0 group-hover:opacity-[0.08] transition-all duration-700">
                <Wand2 size={200} />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="w-16 h-16 bg-[#FF7D00]/10 rounded-2xl flex items-center justify-center text-[#FF7D00] border border-[#FF7D00]/30 shadow-[0_0_30px_rgba(255,125,0,0.2)] group-hover:scale-110 transition-transform duration-500">
                  <Sparkles size={28} />
                </div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
                For Client
              </span>
              </div>

              <h3 className="text-3xl font-black text-white mb-4 relative z-10 tracking-tight">
                자연어 문맥 기반 스킬 자동 추출
              </h3>
              <p className="text-zinc-400 text-base mb-10 leading-relaxed relative z-10">
                프로젝트 소개글만 적으세요. <strong className="text-white">Gemini API</strong>가 문맥을 분석하여 한글 스킬명을
                글로벌 표준 태그로 자동 매핑합니다.
              </p>

              <div className="bg-[#080808] p-6 md:p-8 rounded-[2rem] border border-white/5 relative shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] z-10 group-hover:border-white/10 transition-colors duration-500">
                <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                  <MessageSquare size={16} className="text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 font-mono tracking-widest">Input String</span>
                </div>
                <p className="text-zinc-300 text-base font-medium leading-relaxed mb-6 italic bg-white/5 p-4 rounded-xl">
                  "리액트랑 스프링부트로 지역 배달앱 만들어주실 풀스택 구해요."
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                <span className="flex h-3 w-3 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7D00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF7D00]" />
                </span>
                  <span className="px-4 py-1.5 bg-[#FF7D00]/10 border border-[#FF7D00]/30 text-[#FF7D00] rounded-lg text-sm font-black shadow-[0_0_10px_rgba(255,125,0,0.2)]">
                  #React
                </span>
                  <span className="px-4 py-1.5 bg-[#FF7D00]/10 border border-[#FF7D00]/30 text-[#FF7D00] rounded-lg text-sm font-black shadow-[0_0_10px_rgba(255,125,0,0.2)]">
                  #Spring Boot
                </span>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                custom={0.1}
                viewport={{ once: true, margin: "-80px" }}
                className="bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 relative overflow-hidden group hover:border-white/20 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(122,79,255,0.1)] hover:-translate-y-2 flex flex-col"
            >
              <div className="absolute -top-12 -right-12 opacity-[0.03] rotate-12 group-hover:rotate-0 group-hover:opacity-[0.08] transition-all duration-700">
                <Network size={200} />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="w-16 h-16 bg-[#7A4FFF]/10 rounded-2xl flex items-center justify-center text-[#7A4FFF] border border-[#7A4FFF]/30 shadow-[0_0_30px_rgba(122,79,255,0.2)] group-hover:scale-110 transition-transform duration-500">
                  <Binary size={28} />
                </div>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
                For Freelancer
              </span>
              </div>

              <h3 className="text-3xl font-black text-white mb-4 relative z-10 tracking-tight">
                Multi-Criteria 벡터 추천
              </h3>
              <p className="text-zinc-400 text-base mb-10 leading-relaxed relative z-10">
                키워드 일치를 넘어선 의미론적 접근입니다. 스킬, 작업 방식, 지역 등을{" "}
                <strong className="text-white">다차원 벡터화</strong>하여 가장 완벽한 프로젝트를
                큐레이션합니다.
              </p>

              <div className="bg-[#080808] p-6 md:p-8 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] z-10 relative group-hover:border-white/10 transition-colors duration-500 mt-auto">
                <div className="text-center">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-zinc-400 mb-3 mx-auto shadow-inner">
                    <Code2 size={20} />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">User Vector</p>
                </div>

                <div className="flex-1 px-4 flex flex-col items-center justify-center relative">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#7A4FFF]/50 to-transparent w-full absolute" />
                  <div className="h-px bg-gradient-to-r from-transparent via-white to-transparent w-1/2 absolute animate-pulse" />
                  <span className="relative bg-black px-4 py-2 rounded-full border border-[#7A4FFF]/40 text-[10px] font-black text-white shadow-[0_0_20px_rgba(122,79,255,0.3)] mt-6 uppercase tracking-widest">
                  Semantic Match
                </span>
                </div>

                <div className="text-center">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 text-zinc-400 mb-3 mx-auto shadow-inner">
                    <Workflow size={20} />
                  </div>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Project Vector</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
  );
}

// ─── Portfolio / Bento Grid Section ──────────────────────────────────────────

function PortfolioSection() {
  return (
      <section className="relative z-10 py-32 px-6 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true, margin: "-40px" }}
              className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-3">
                Track Record
              </p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-zinc-900">
                Proven Archive
              </h2>
              <p className="text-zinc-500 font-medium text-lg max-w-xl">
                서비스에서 성공적으로 완수된 핵심 프로젝트 데이터베이스. 압도적인 결과물로 증명합니다.
              </p>
            </div>
          </motion.div>

          <motion.div
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
          >
            {/* Card 1 */}
            <motion.div
                variants={fadeUp}
                className="col-span-1 md:col-span-2 bg-gradient-to-br from-orange-50/50 to-white rounded-[2.5rem] border border-orange-100/50 p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_20px_40px_-15px_rgba(255,125,0,0.15)] hover:border-orange-200 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="relative z-10">
              <span className="inline-block px-3.5 py-1.5 bg-white border border-orange-200 rounded-full text-[10px] font-black text-[#FF7D00] uppercase mb-4 shadow-sm">
                #Figma #React
              </span>
                <h3 className="text-3xl font-black text-zinc-900 leading-tight mb-3 group-hover:text-[#FF7D00] transition-colors duration-300">
                  지역 기반 매칭 시스템
                  <br />
                  UI/UX 고도화
                </h3>
                <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                  <Star size={16} className="text-[#FF7D00] fill-current" /> 5.0 만족도
                </div>
              </div>
              <div className="absolute right-[-5%] bottom-[-20%] w-72 h-72 bg-white rounded-full shadow-2xl border-[6px] border-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
                <div className="w-36 h-36 bg-orange-50 rounded-full flex items-center justify-center">
                  <MapPin size={56} className="text-[#FF7D00]" />
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
                variants={fadeUp}
                className="col-span-1 bg-gradient-to-br from-purple-50/50 to-white rounded-[2.5rem] border border-purple-100/50 p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_20px_40px_-15px_rgba(122,79,255,0.15)] hover:border-purple-200 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="relative z-10">
              <span className="inline-block px-3.5 py-1.5 bg-white border border-purple-200 rounded-full text-[10px] font-black text-[#7A4FFF] uppercase mb-4 shadow-sm">
                #Socket.io #Node.js
              </span>
                <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-[#7A4FFF] transition-colors duration-300">
                  실시간 1:1 채팅
                  <br />
                  소켓 서버 구축
                </h3>
              </div>
              <div className="flex justify-end mt-8">
                <div className="bg-white p-5 rounded-3xl shadow-lg border border-purple-100 group-hover:-translate-y-3 group-hover:shadow-xl transition-all duration-500">
                  <MessageSquare size={36} className="text-[#7A4FFF]" />
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
                variants={fadeUp}
                className="col-span-1 bg-gradient-to-br from-emerald-50/50 to-white rounded-[2.5rem] border border-emerald-100/50 p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-200 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="relative z-10">
              <span className="inline-block px-3.5 py-1.5 bg-white border border-emerald-200 rounded-full text-[10px] font-black text-emerald-600 uppercase mb-4 shadow-sm">
                #Spring Boot #Security
              </span>
                <h3 className="text-2xl font-black text-zinc-900 leading-tight group-hover:text-emerald-600 transition-colors duration-300">
                  안전 결제 모듈
                  <br />
                  (에스크로) 연동
                </h3>
              </div>
              <div className="flex justify-end mt-8">
                <div className="bg-white p-5 rounded-3xl shadow-lg border border-emerald-100 group-hover:-translate-y-3 group-hover:shadow-xl transition-all duration-500">
                  <Lock size={36} className="text-emerald-500" />
                </div>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div
                variants={fadeUp}
                className="col-span-1 md:col-span-2 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
              <span className="inline-block px-3.5 py-1.5 bg-white/10 border border-white/10 text-zinc-300 rounded-full text-[10px] font-black uppercase mb-4 backdrop-blur-md">
                #Next.js #TypeScript
              </span>
                <h3 className="text-3xl font-black text-white leading-tight mb-3">
                  구독 통합 관리
                  <br />
                  어드민 대시보드
                </h3>
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-400">
                  <CheckCircle2 size={16} className="text-emerald-400" /> 운영 환경 배포 완료
                </div>
              </div>
              <div className="absolute right-[-2%] bottom-[-20%] w-72 h-72 bg-zinc-800 rounded-[3rem] shadow-2xl border border-zinc-700/50 flex items-center justify-center rotate-12 group-hover:rotate-6 group-hover:scale-105 transition-transform duration-700 ease-out">
                <BarChart3 size={72} className="text-zinc-600" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
  );
}

// ─── Feature Section ──────────────────────────────────────────────────────────

const features = [
  {
    icon: <MapPin size={32} />,
    title: "Hyper-Local Matching",
    desc: "단순한 온라인 외주가 아닙니다. 오프라인 협업 모드 선택 시, 실제 대면 미팅이 가능한 반경 내 인재를 거리순으로 소집합니다.",
  },
  {
    icon: <Layers size={32} />,
    title: "Semantic & Rule Precision",
    desc: "생성형 AI의 의미론적 분석과 데이터베이스 규칙 기반 엔진을 결합하여 노이즈 없는 압도적인 매칭을 보장합니다.",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Verified Trust System",
    desc: "단순한 별점이 아닙니다. 안심결제 모듈과 상호 평가를 바탕으로 한 투명한 등급(TOP Talent) 시스템으로 신뢰를 증명합니다.",
  },
];

function FeatureSection() {
  return (
      <section className="relative z-10 py-32 px-6 bg-zinc-50 border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
              initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true, margin: "-40px" }}
              className="text-center mb-20"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">
              Core Value
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-5">왜 DevNear 인가요?</h2>
            <p className="text-zinc-500 font-medium max-w-lg mx-auto text-lg">
              기존 프리랜서 플랫폼의 한계를 완벽하게 극복한 3가지 코어 밸류.
            </p>
          </motion.div>

          <motion.div
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true, margin: "-40px" }}
              className="grid md:grid-cols-3 gap-8"
          >
            {features.map((item, idx) => (
                <motion.div
                    variants={fadeUp}
                    key={idx}
                    className="bg-white p-10 rounded-[2.5rem] border border-zinc-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-default"
                >
                  <div className="w-16 h-16 bg-orange-50 text-[#FF7D00] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FF7D00] group-hover:text-white group-hover:scale-110 transition-all duration-400 shadow-inner">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-black mb-4 tracking-tight text-zinc-900 group-hover:text-[#FF7D00] transition-colors duration-300">{item.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner({ onCTA }: { onCTA: () => void }) {
  return (
      <section className="relative z-10 py-32 px-6 bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF7D00]/5 via-transparent to-[#7A4FFF]/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7A4FFF] opacity-[0.06] blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
              initial="hidden"
              whileInView="visible"
              variants={fadeUp}
              viewport={{ once: true }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">
              Ready to Deploy
            </p>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight">
              지금 바로 서비스에
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7D00] to-[#7A4FFF]">
              접속하세요.
            </span>
            </h2>
            <p className="text-zinc-400 font-medium mb-12 text-lg leading-relaxed">
              무료로 시작하고, 완벽한 파트너를 발견하세요.
            </p>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onCTA}
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-zinc-950 rounded-full font-black text-base hover:bg-gradient-to-r hover:from-[#FF7D00] hover:to-[#7A4FFF] hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,125,0,0.4)]"
            >
              서비스 접속하기 <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-[3px] border-[#FF7D00]/20 border-t-[#FF7D00] animate-spin" />
          <p className="font-mono text-xs font-black text-[#FF7D00] uppercase tracking-[0.2em] animate-pulse">
            {`// SYSTEM_SCANNING...`}
          </p>
        </div>
      </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/v1/users/me");
        const role = res.data.role;
        const next = postLoginPathForRole(role);
        if (next !== "/") {
          router.replace(next);
          return;
        }
        setUser(res.data as UserData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleCTA = useCallback(() => router.push("/login"), [router]);

  if (loading) return <LoadingScreen />;

  return (
      <div className="relative min-h-screen bg-zinc-50 font-sans text-zinc-900 overflow-x-hidden selection:bg-[#7A4FFF]/30">
        {/* Background grid */}
        <div
            className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
            style={{
              backgroundImage:
                  "linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
        />
        <div className="fixed top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-[#7A4FFF] opacity-[0.03] blur-[150px] rounded-full z-0 pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#FF7D00] opacity-[0.03] blur-[150px] rounded-full z-0 pointer-events-none" />

        <HeroSection onCTA={handleCTA} />
        <SimulatorSection />
        <RuleEngineSection />
        <AISection />
        <PortfolioSection />
        <FeatureSection />
        <CTABanner onCTA={handleCTA} />

        {/* Footer */}
        <footer className="relative z-10 pt-20 pb-12 px-6 bg-white border-t border-zinc-100 text-center">
          <div className="mb-8 flex justify-center">
            <img
                src="/devnear-logo.png"
                alt="Logo"
                className="h-30 w-auto opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          </div>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] font-mono">
            &copy; 2026 Base_Command_Center. Access_Granted. All systems nominal.
          </p>
        </footer>
      </div>
  );
}