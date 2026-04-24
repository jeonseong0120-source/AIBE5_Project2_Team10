'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import api from '@/app/lib/axios';
import { getCurrentUserId } from '@/app/lib/auth';
import { createOrGetChatRoom } from '@/app/lib/chatApi';
import { useChatStore } from '@/app/store/chatStore';

export type SkillItem = string | { name: string };

export interface ProjectDetail {
    projectId: number;
    companyName: string;
    logoUrl?: string;
    projectName: string;
    budget: number;
    deadline: string;
    detail: string;
    status: string;
    online: boolean;
    offline: boolean;
    location: string;
    latitude?: number;
    longitude?: number;
    skills: SkillItem[];
    clientUserId?: number;
    userId?: number;
    clientId?: number;
    writerId?: number;
    ownerUserId?: number;
}

function isAbortError(err: unknown): boolean {
    if (axios.isCancel(err)) return true;
    const code = (err as { code?: string })?.code;
    return code === 'ERR_CANCELED';
}

export function useProjectDetail(projectId: number | null) {
    const openChat = useChatStore((state) => state.openChat);
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isApplied, setIsApplied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [bidPrice, setBidPrice] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [refetchTick, setRefetchTick] = useState(0);
    const prevProjectIdRef = useRef<number | null>(null);
    /** 같은 projectId에서 refetch 시 사용자가 수정한 bidPrice를 덮어쓰지 않도록, 시드한 프로젝트 id만 기록 */
    const bidPriceSeededForProjectIdRef = useRef<number | null>(null);

    const refetch = useCallback(() => {
        if (projectId == null) return;
        setRefetchTick((t) => t + 1);
    }, [projectId]);

    useEffect(() => {
        const prevId = prevProjectIdRef.current;
        const projectIdChanged = prevId !== projectId;
        prevProjectIdRef.current = projectId;

        if (!projectId) {
            bidPriceSeededForProjectIdRef.current = null;
            setProject(null);
            setError(null);
            setLoading(false);
            setIsApplied(false);
            setIsBookmarked(false);
            setIsApplyOpen(false);
            setMessage('');
            return;
        }

        const controller = new AbortController();
        const { signal } = controller;

        if (projectIdChanged) {
            setProject(null);
            setIsApplied(false);
            setIsBookmarked(false);
        }
        setLoading(true);
        setError(null);
        setIsApplyOpen(false);
        setMessage('');

        void (async () => {
            try {
                const response = await api.get(`/v1/projects/${projectId}`, { signal });
                if (signal.aborted) return;
                setProject(response.data);
                if (bidPriceSeededForProjectIdRef.current !== projectId) {
                    setBidPrice(String(response.data.budget ?? ''));
                    bidPriceSeededForProjectIdRef.current = projectId;
                }
            } catch (err: unknown) {
                if (signal.aborted || isAbortError(err)) return;
                const status = (err as { response?: { status?: number } })?.response?.status;
                if (status !== 401) {
                    setError('프로젝트 정보를 불러오는데 실패했습니다.');
                } else {
                    setError(null);
                }
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const myApps = await api.get('/applications/me', { signal });
                    if (signal.aborted) return;
                    setIsApplied(myApps.data.some((app: { projectId?: number }) => app.projectId === Number(projectId)));
                } catch (err: unknown) {
                    if (signal.aborted || isAbortError(err)) return;
                    setIsApplied(false);
                }

                try {
                    const myBookmarks = await api.get('/v1/bookmarks/projects?size=1000', { signal });
                    if (signal.aborted) return;
                    const bookmarkList = myBookmarks.data.content || [];
                    setIsBookmarked(bookmarkList.some((b: { projectId?: number }) => b.projectId === Number(projectId)));
                } catch (err: unknown) {
                    if (signal.aborted || isAbortError(err)) return;
                    setIsBookmarked(false);
                }
            } else {
                if (signal.aborted) return;
                setIsApplied(false);
                setIsBookmarked(false);
            }

            if (!signal.aborted) {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [projectId, refetchTick]);

    const toggleBookmark = useCallback(async () => {
        if (!projectId) return;
        try {
            if (isBookmarked) {
                await api.delete(`/v1/bookmarks/projects/${projectId}`);
                setIsBookmarked(false);
            } else {
                await api.post(`/v1/bookmarks/projects/${projectId}`);
                setIsBookmarked(true);
            }
        } catch {
            alert('찜하기 처리에 실패했습니다.');
        }
    }, [isBookmarked, projectId]);

    const startChat = useCallback(async (onSuccess?: () => void) => {
        if (!project || chatLoading) return;

        const targetUserId =
            project.clientUserId ??
            project.userId ??
            project.clientId ??
            project.writerId ??
            project.ownerUserId ??
            null;

        const currentUserId = getCurrentUserId();
        if (currentUserId !== null && targetUserId === currentUserId) {
            alert('본인에게는 문의할 수 없습니다.');
            return;
        }

        if (!targetUserId) {
            console.error('프로젝트 응답에 작성자 userId가 없습니다.', project);
            alert('채팅 대상 정보가 없습니다.');
            return;
        }

        try {
            setChatLoading(true);
            const response = await createOrGetChatRoom(targetUserId, project.projectId);
            openChat(response.roomId);
            onSuccess?.();
        } catch (error) {
            console.error('채팅방 생성/조회 실패:', error);
            alert('문의하기를 열지 못했습니다.');
        } finally {
            setChatLoading(false);
        }
    }, [chatLoading, openChat, project]);

    const apply = useCallback(async () => {
        if (!projectId) return;
        const bid = Number(bidPrice);
        if (!bidPrice || !Number.isFinite(bid) || bid <= 0 || !message.trim()) {
            alert('금액과 메시지를 입력해 주세요.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/applications', {
                projectId,
                bidPrice: bid,
                message: message.trim(),
            });
            alert('지원이 완료되었습니다!');
            setIsApplied(true);
            setIsApplyOpen(false);
        } catch {
            alert('지원 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    }, [bidPrice, message, projectId]);
    return {
        project,
        loading,
        error,
        isApplied,
        isBookmarked,
        chatLoading,
        isApplyOpen,
        bidPrice,
        message,
        submitting,
        setIsApplyOpen,
        setBidPrice,
        setMessage,
        refetch,
        toggleBookmark,
        startChat,
        apply,
    };
}

