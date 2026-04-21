"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Map as MapIcon, List, X, MapPin, Globe, Zap, Send, Search } from "lucide-react";
import { getMatchingResults, type FreelancerMatch } from "@/app/lib/projectApi";
import api from '@/app/lib/axios';
import { useRouter } from "next/navigation";
import Script from "next/script"; // ✅ 추가: 런타임 로딩을 위해 필요

interface Props {
    projectId: number;
    onClose: () => void;
}

export default function MatchingresultForm({ projectId, onClose }: Props) {
    const router = useRouter();
    const mapContainer = useRef<HTMLDivElement>(null);

    // 🎯 환경 변수 참조 (마스터의 .env 이름과 일치)
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

    // 상태 관리
    const [freelancers, setFreelancers] = useState<FreelancerMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    // 1. 초기 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const [userRes, projectRes] = await Promise.all([
                    api.get("/v1/users/me"),
                    api.get(`/v1/projects/${projectId}`)
                ]);

                setUser(userRes.data);
                setProject(projectRes.data);
                setAuthorized(true);

                if (projectRes.data.offline) setViewMode("map");

                const matches = await getMatchingResults(projectId);
                setFreelancers(matches);
            } catch (err) {
                console.error("데이터 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [projectId]);

    const getMatchReason = (f: FreelancerMatch, index: number) => {
        const isOffline = project?.offline;
        const skillMatchCount = f.skills?.length || 0;
        const isTopRank = index === 0;
        if (isTopRank) {
            if (f.matchingRate >= 95) return "요구 스킬 완벽 일치 및 검증된 평점을 보유한 마스터급 요원입니다.";
            return isOffline ? "거리, 실력, 평점의 밸런스가 가장 뛰어난 현시점 최적의 매칭입니다." : "원격 협업 환경에서 가장 높은 생산성을 기대할 수 있는 최우수 요원입니다.";
        }
        if (f.matchingRate > 80 && skillMatchCount >= 2) return `핵심 기술(${(f.skills ?? []).slice(0, 2).join(", ")})에 대한 숙련도가 매우 높습니다.`;
        if (f.averageRating >= 4.8 || f.completedProjects >= 5) return "프로젝트 완료 경험이 풍부하며 유저들 사이에서 검증된 신뢰도를 자랑합니다.";
        if (isOffline && f.distance && f.distance <= 3) return "거주지 인접으로 긴급 미팅 및 실시간 오프라인 협업 환경에 최적화되어 있습니다.";
        return "본 프로젝트의 요구 조건에 부합하는 안정적인 역량을 갖춘 전문가입니다.";
    };

    const formatDistance = (f: FreelancerMatch) => {
        if (!project?.offline) return "Remote Agent";
        const dist = f.distance;
        return (dist === undefined || dist === null) ? "거리 정보 없음" : (dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`);
    };

    // 3. 🎯 카카오 맵 렌더링 (안전 장치 강화 버전)
    useEffect(() => {
        let map: any = null;
        const overlays: any[] = [];
        let retryCount = 0;
        const maxRetries = 30;
        let isMounted = true;
        let retryTimerId: NodeJS.Timeout;

        const drawMap = () => {
            if (!isMounted) return;
            const kakao = (window as any).kakao;

            // SDK 감지 및 폴링
            if (!kakao || !kakao.maps) {
                if (retryCount < maxRetries) {
                    retryCount++;
                    retryTimerId = setTimeout(drawMap, 100);
                } else {
                    console.error("[MatchingMap] SDK 로드 실패.");
                }
                return;
            }

            if (!mapContainer.current) return;

            kakao.maps.load(() => {
                if (!isMounted) return;
                const centerPos = new kakao.maps.LatLng(project.latitude, project.longitude);
                map = new kakao.maps.Map(mapContainer.current, { center: centerPos, level: 5 });

                const projectOverlay = new kakao.maps.CustomOverlay({
                    position: centerPos,
                    content: `<div style="background: #FF7D00; color: white; padding: 6px 12px; border-radius: 12px; font-weight: 900; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 15px rgba(255, 125, 0, 0.4); transform: translateY(-10px); white-space: nowrap;">📍 내 프로젝트 위치</div>`,
                    yAnchor: 1
                });
                projectOverlay.setMap(map);
                overlays.push(projectOverlay);

                freelancers.forEach((f, index) => {
                    if (!f.latitude || !f.longitude || !isMounted) return;
                    const position = new kakao.maps.LatLng(f.latitude, f.longitude);
                    const freelancerOverlay = new kakao.maps.CustomOverlay({
                        position,
                        content: `<div style="background: #7A4FFF; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(122, 79, 255, 0.4); cursor: pointer;">${index + 1}</div>`,
                        yAnchor: 1
                    });
                    freelancerOverlay.setMap(map);
                    overlays.push(freelancerOverlay);
                });
            });
        };

        if (!loading && project?.offline && viewMode === "map" && freelancers.length > 0) {
            drawMap();
        }

        return () => {
            isMounted = false;
            if (retryTimerId) clearTimeout(retryTimerId);
            overlays.forEach(o => o.setMap(null));
            if (mapContainer.current) mapContainer.current.innerHTML = '';
            map = null;
        };
    }, [loading, freelancers, project, viewMode]);

    if (!authorized) return null;

    return (
        <>
            {/* 🎯 [추가] 런타임 가드: 입장권이 있을 때만 비서를 소집함 */}
            {KAKAO_KEY && (
                <Script
                    src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`}
                    strategy="afterInteractive"
                />
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
                <motion.div initial={{ y: 50, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="bg-[#FBFBFB] w-full max-w-7xl h-[90vh] rounded-[3rem] shadow-2xl relative border border-zinc-200 overflow-hidden flex flex-col">

                    <header className="bg-white px-8 py-5 border-b border-zinc-100 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF7D00]"><Star fill="currentColor" size={20} /></div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">AI 자동 매칭 결과</h2>
                                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest font-mono">Found: {freelancers.length} Agents</p>
                            </div>
                        </div>
                        {project?.offline && (
                            <div className="flex bg-zinc-100 p-1.5 rounded-2xl gap-1">
                                <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}><List size={16} /> 리스트</button>
                                <button onClick={() => setViewMode("map")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-[#FF7D00] text-white shadow-lg shadow-orange-100' : 'text-zinc-400'}`}><MapIcon size={16} /> 지도</button>
                            </div>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors"><X size={24} className="text-zinc-300" /></button>
                    </header>

                    <div className="flex-1 flex overflow-hidden">
                        {(viewMode === "map" && project?.offline) && (
                            <aside className="hidden lg:block w-[55%] p-6 animate-in fade-in duration-500">
                                <div ref={mapContainer} className="w-full h-full bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-inner relative overflow-hidden" />
                            </aside>
                        )}
                        <main className={`flex-1 overflow-y-auto p-6 pt-4 space-y-4 transition-all duration-500 ${(viewMode !== "map" || !project?.offline) ? "max-w-4xl mx-auto w-full" : ""}`}>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <div className="w-10 h-10 border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">Matching_Now...</p>
                                </div>
                            ) : freelancers.length > 0 ? (
                                freelancers.map((f, index) => (
                                    <motion.div key={f.profileId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`bg-white rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/30 transition-all shadow-sm hover:shadow-md group ${(viewMode === "map" && project?.offline) ? 'p-4' : 'p-6'}`}>
                                        <div className="flex items-center gap-4 lg:gap-6">
                                            <div className="relative shrink-0">
                                                <div className={`absolute -top-1 -left-1 rounded-full flex items-center justify-center text-white font-black shadow-md z-10 ${(viewMode === "map" && project?.offline) ? 'w-6 h-6 text-[8px]' : 'w-7 h-7 text-[10px]'} ${index === 0 ? 'bg-[#FFAD00]' : 'bg-zinc-300'}`}>{index + 1}</div>
                                                <img src={f.profileImageUrl || `https://ui-avatars.com/api/?name=${f.nickname}&background=7A4FFF&color=fff&bold=true`} alt={f.nickname} className={` ${(viewMode === "map" && project?.offline) ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover shadow-sm border-2 border-white bg-zinc-100`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className={`font-black text-zinc-950 truncate ${(viewMode === "map" && project?.offline) ? 'text-sm' : 'text-lg'}`}>{f.nickname}</h3>
                                                    <div className="flex items-center gap-0.5 text-orange-400 font-bold text-xs"><Star size={12} className="fill-current" /> {f.averageRating}</div>
                                                </div>
                                                <div className={`relative border-l-4 border-[#FF7D00] bg-gradient-to-r from-orange-50/50 to-transparent ${(viewMode === "map" && project?.offline) ? 'p-2.5 mb-2' : 'p-4 mb-3'} rounded-r-2xl`}>
                                                    <div className="flex items-start gap-2.5">
                                                        <Zap size={(viewMode === "map" && project?.offline) ? 12 : 14} className="text-[#FF7D00] mt-0.5 shrink-0 fill-current" />
                                                        <p className={`font-bold text-zinc-700 leading-relaxed break-keep ${(viewMode === "map" && project?.offline) ? 'text-[11px]' : 'text-[13px]'}`}>{getMatchReason(f, index)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold font-mono uppercase">
                                                    {project?.offline ? <MapPin size={10} /> : <Globe size={10} className="text-[#7A4FFF]" />} {formatDistance(f)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <div className="text-right">
                                                    <div className={`text-[#FF7D00] font-black tracking-tighter ${(viewMode === "map" && project?.offline) ? 'text-base' : 'text-xl'}`}>⚡ {f.matchingRate}%</div>
                                                </div>
                                                <button onClick={() => router.push(`/client/freelancers/${f.profileId}`)} className={`bg-[#FF7D00] text-white rounded-xl font-black shadow-lg shadow-orange-100 hover:bg-[#FF8D20] transition-all flex items-center gap-1.5 ${(viewMode === "map" && project?.offline) ? 'px-3 py-2 text-[10px]' : 'px-6 py-3 text-xs'}`}>
                                                    {(viewMode === "map" && project?.offline) ? '보기' : '상세보기'} <Send size={(viewMode === "map" && project?.offline) ? 12 : 14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-300 uppercase font-black font-mono tracking-widest">No_Agent_Found</div>
                            )}
                        </main>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}