"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Map as MapIcon, List, X, MapPin, Globe, Zap, Send, Search } from "lucide-react";
import { getMatchingResults, type FreelancerMatch } from "@/app/lib/projectApi";
import api from '@/app/lib/axios';
import { useRouter } from "next/navigation";

interface Props {
    projectId: number;
    onClose: () => void;
}

export default function MatchingresultForm({ projectId, onClose }: Props) {
    const router = useRouter();
    const mapContainer = useRef<HTMLDivElement>(null);

    // 상태 관리
    const [freelancers, setFreelancers] = useState<FreelancerMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"list" | "map">("list");
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<any>(null);

    // 초기 데이터 로드
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

                // 오프라인 프로젝트일 때만 지도 뷰를 기본으로 설정
                if (projectRes.data.offline) {
                    setViewMode("map");
                }

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

    // 🎯 [지능형 분석] 프로젝트 성격과 순위에 따른 매칭 사유 생성
    const getMatchReason = (f: FreelancerMatch, index: number) => {
        const isOffline = project?.offline;
        const skillMatchCount = f.skills?.length || 0;
        const isTopRank = index === 0;

        if (isTopRank) {
            if (f.matchingRate >= 95) return "요구 스킬 완벽 일치 및 검증된 평점을 보유한 마스터급 요원입니다.";
            return isOffline
                ? "거리, 실력, 평점의 밸런스가 가장 뛰어난 현시점 최적의 매칭입니다."
                : "원격 협업 환경에서 가장 높은 생산성을 기대할 수 있는 최우수 요원입니다.";
        }

        // ✅ [Fix 1] f.skills 안전 접근 처리 (nullish coalescing 사용)
        if (f.matchingRate > 80 && skillMatchCount >= 2) {
            return `핵심 기술(${(f.skills ?? []).slice(0, 2).join(", ")})에 대한 숙련도가 매우 높습니다.`;
        }

        if (f.averageRating >= 4.8 || f.completedProjects >= 5) {
            return "프로젝트 완료 경험이 풍부하며 유저들 사이에서 검증된 신뢰도를 자랑합니다.";
        }

        if (isOffline && f.distance && f.distance <= 3) {
            return "거주지 인접으로 긴급 미팅 및 실시간 오프라인 협업 환경에 최적화되어 있습니다.";
        }

        if (f.matchingRate < 15) {
            return "현재 매칭 스킬은 적으나 프로필 완성도와 시스템 신뢰 지수가 높아 추천된 요원입니다.";
        }

        return "본 프로젝트의 요구 조건에 부합하는 안정적인 역량을 갖춘 전문가입니다.";
    };

    // 거리 포맷팅
    const formatDistance = (f: FreelancerMatch) => {
        if (!project?.offline) return "Remote Agent";
        const dist = f.distance;
        if (dist === undefined || dist === null) return "거리 정보 없음";
        return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
    };

    // 🎯 [핵심] 카카오 맵 렌더링 (내 위치 마커 + 요원 마커)
    useEffect(() => {
        const { kakao } = window as any;
        // ✅ [Fix 2] 오버레이 추적을 위한 배열 선언
        const overlays: any[] = [];
        let map: any = null;

        if (!loading && project?.offline && viewMode === "map" && freelancers.length > 0 && kakao && mapContainer.current) {

            // 내 프로젝트 위치를 중심으로 설정
            const centerPos = new kakao.maps.LatLng(project.latitude, project.longitude);
            const options = { center: centerPos, level: 5 };
            map = new kakao.maps.Map(mapContainer.current, options);

            // 1. 내 프로젝트(마스터) 위치 마커 - 오렌지색
            const projectContent = `
                <div style="
                    background: #FF7D00; 
                    color: white; 
                    padding: 6px 12px; 
                    border-radius: 12px; 
                    font-weight: 900; 
                    font-size: 11px; 
                    border: 2px solid white; 
                    box-shadow: 0 4px 15px rgba(255, 125, 0, 0.4); 
                    transform: translateY(-10px);
                    white-space: nowrap;
                ">
                    📍 내 프로젝트 위치
                </div>
            `;
            const projectOverlay = new kakao.maps.CustomOverlay({
                position: centerPos,
                content: projectContent,
                yAnchor: 1
            });
            projectOverlay.setMap(map);
            overlays.push(projectOverlay); // ✅ 오버레이 저장

            // 2. 프리랜서(요원) 위치 마커들 - 보라색 번호판
            freelancers.forEach((f, index) => {
                if (!f.latitude || !f.longitude) return;
                const position = new kakao.maps.LatLng(f.latitude, f.longitude);
                const content = `
                    <div style="background: #7A4FFF; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 10px rgba(122, 79, 255, 0.4); cursor: pointer;">
                        ${index + 1}
                    </div>
                `;
                const freelancerOverlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 1 });
                freelancerOverlay.setMap(map);
                overlays.push(freelancerOverlay); // ✅ 오버레이 저장
            });
        }

        // ✅ [Fix 2] Cleanup 함수: 언마운트되거나 의존성 변경 시 메모리 해제 및 DOM 정리
        return () => {
            overlays.forEach(overlay => overlay.setMap(null));
            if (mapContainer.current) {
                mapContainer.current.innerHTML = '';
            }
            map = null;
        };
    }, [loading, freelancers, project, viewMode]);

    if (!authorized) return null;

    // 현재 지도 모드 상태인지 확인
    const isMapView = viewMode === "map" && project?.offline;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <motion.div initial={{ y: 50, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="bg-[#FBFBFB] w-full max-w-7xl h-[90vh] rounded-[3rem] shadow-2xl relative border border-zinc-200 overflow-hidden flex flex-col">

                {/* 헤더 영역 */}
                <header className="bg-white px-8 py-5 border-b border-zinc-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF7D00]"><Star fill="currentColor" size={20} /></div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                                AI 매칭 결과
                                {!project?.offline && <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-[#7A4FFF] text-[10px] rounded-md font-bold uppercase">Online</span>}
                            </h2>
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
                    {/* 지도 영역 */}
                    {isMapView && (
                        <aside className="hidden lg:block w-[55%] p-6 animate-in fade-in duration-500">
                            <div ref={mapContainer} className="w-full h-full bg-zinc-50 rounded-[2.5rem] border border-zinc-100 shadow-inner relative overflow-hidden" />
                        </aside>
                    )}

                    {/* 프리랜서 리스트 영역 */}
                    <main className={`flex-1 overflow-y-auto p-6 pt-4 space-y-4 transition-all duration-500 ${!isMapView ? "max-w-4xl mx-auto w-full" : ""}`}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <div className="w-10 h-10 border-4 border-[#FF7D00] border-t-transparent rounded-full animate-spin" />
                                <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest">Matching_Now...</p>
                            </div>
                        ) : freelancers.length > 0 ? (
                            freelancers.map((f, index) => (
                                <motion.div
                                    key={f.profileId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`bg-white rounded-[2rem] border border-zinc-100 hover:border-[#FF7D00]/30 transition-all shadow-sm hover:shadow-md group ${isMapView ? 'p-4' : 'p-6'}`}
                                >
                                    <div className="flex items-center gap-4 lg:gap-6">

                                        {/* 프로필 이미지 */}
                                        <div className="relative shrink-0">
                                            <div className={`absolute -top-1 -left-1 rounded-full flex items-center justify-center text-white font-black shadow-md z-10 ${isMapView ? 'w-6 h-6 text-[8px]' : 'w-7 h-7 text-[10px]'} ${index === 0 ? 'bg-[#FFAD00]' : 'bg-zinc-300'}`}>{index + 1}</div>
                                            <img
                                                src={f.profileImageUrl || `https://ui-avatars.com/api/?name=${f.nickname}&background=7A4FFF&color=fff&bold=true`}
                                                alt={f.nickname}
                                                className={`${isMapView ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover shadow-sm border-2 border-white bg-zinc-100`}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className={`font-black text-zinc-950 truncate ${isMapView ? 'text-sm' : 'text-lg'}`}>{f.nickname}</h3>
                                                <div className="flex items-center gap-0.5 text-orange-400 font-bold text-xs"><Star size={12} className="fill-current" /> {f.averageRating}</div>
                                            </div>

                                            {/* 지도 모드가 아닐 때만 스킬 태그 노출 */}
                                            {!isMapView && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {/* ✅ [Fix 1] f.skills 안전 접근 처리 */}
                                                    {(f.skills ?? []).slice(0, 4).map(skill => (
                                                        <span key={skill} className="px-3 py-1 bg-indigo-50 text-[#7A4FFF] rounded-full text-[10px] font-bold border border-indigo-100/50">{skill}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* AI 매칭 분석 위젯 */}
                                            <div className={`relative border-l-4 border-[#FF7D00] bg-gradient-to-r from-orange-50/50 to-transparent ${isMapView ? 'p-2.5 mb-2' : 'p-4 mb-3'} rounded-r-2xl`}>
                                                <div className="flex items-start gap-2.5">
                                                    <Zap size={isMapView ? 12 : 14} className="text-[#FF7D00] mt-0.5 shrink-0 fill-current" />
                                                    <div className="space-y-0.5">
                                                        {!isMapView && <span className="text-[9px] font-black uppercase tracking-tighter text-[#FF7D00]/70">AI Match Analysis</span>}
                                                        <p className={`font-bold text-zinc-700 leading-relaxed break-keep ${isMapView ? 'text-[11px]' : 'text-[13px]'}`}>
                                                            {getMatchReason(f, index)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold font-mono uppercase">
                                                {project?.offline ? <MapPin size={10} /> : <Globe size={10} className="text-[#7A4FFF]" />}
                                                {formatDistance(f)}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="text-right">
                                                <div className={`text-[#FF7D00] font-black tracking-tighter ${isMapView ? 'text-base' : 'text-xl'}`}>⚡ {f.matchingRate}%</div>
                                                <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-none">Score</p>
                                            </div>

                                            <button
                                                onClick={() => router.push(`/client/freelancers/${f.profileId}`)}
                                                className={`bg-[#FF7D00] text-white rounded-xl font-black shadow-lg shadow-orange-100 hover:bg-[#FF8D20] transition-all flex items-center gap-1.5 ${isMapView ? 'px-3 py-2 text-[10px]' : 'px-6 py-3 text-xs'}`}
                                            >
                                                {isMapView ? '보기' : '상세보기'}
                                                <Send size={isMapView ? 12 : 14} />
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
    );
}