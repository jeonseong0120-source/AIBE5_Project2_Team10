'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { logout } from '@/app/lib/authEvents';

/**
 * 마이페이지 우측 메인 카드 안 하단 — 기존 흰 카드 배경을 그대로 이어 받침대만 두고,
 * 눈에 잘 띄지 않는 회색 톤의 「회원 탈퇴」만 표시합니다. (별도 풀폭 흰 배경 없음)
 */
export default function MypageWithdrawFooter() {
    const router = useRouter();
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = async () => {
        if (isWithdrawing) return;
        const confirmed = confirm(
            '정말 회원 탈퇴하시겠습니까?\n탈퇴 후에는 계정을 복구할 수 없습니다.'
        );
        if (!confirmed) return;

        try {
            setIsWithdrawing(true);
            await api.delete('/v1/users/me/account');
            alert('회원 탈퇴가 완료되었습니다.');
            logout();
            router.push('/');
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message ===
                    'string'
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : null;
            alert(message || '회원 탈퇴에 실패했습니다. 조건을 확인해주세요.');
            setIsWithdrawing(false);
        }
    };

    return (
        <div
            className="mt-auto w-full shrink-0 pt-10 pb-2 md:pb-4 flex flex-col items-center gap-1"
            aria-label="회원 탈퇴"
        >
            <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="text-[11px] font-medium tracking-wide text-zinc-300 hover:text-zinc-400 disabled:text-zinc-200 disabled:cursor-not-allowed transition-colors underline-offset-4 hover:underline decoration-zinc-200"
            >
                {isWithdrawing ? '탈퇴 처리 중…' : '회원 탈퇴'}
            </button>
            <p className="text-[9px] text-zinc-200 font-mono tracking-tight text-center px-4">
                진행 시 계정이 비활성화되며 복구할 수 없습니다.
            </p>
        </div>
    );
}
