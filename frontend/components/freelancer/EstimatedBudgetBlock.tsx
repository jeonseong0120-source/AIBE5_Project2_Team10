'use client';

function manWonFromBudget(budgetWon: number | null | undefined): number | null {
    const n = Number(budgetWon);
    if (!Number.isFinite(n) || n <= 0) {
        return null;
    }
    const man = Math.round(n / 10_000);
    return man > 0 ? man : null;
}

type Props = {
    budgetWon: number | null | undefined;
    /** AI 카드 등 작은 영역 */
    size?: 'sm' | 'md' | 'lg';
    /** 목록 카드는 오른쪽 정렬, 모달 통계 칸은 왼쪽 */
    align?: 'left' | 'right';
    className?: string;
    showLabel?: boolean;
};

/**
 * 예산 표기 통일: 우측 상단 "예상 예산" + ₩(주황) + 숫자(검정) + 만원(회색)
 */
export function EstimatedBudgetBlock({
    budgetWon,
    size = 'md',
    align = 'right',
    className = '',
    showLabel = true,
}: Props) {
    const man = manWonFromBudget(budgetWon);
    const isSm = size === 'sm';
    const isLg = size === 'lg';

    const rootAlign = align === 'right' ? 'text-right' : 'text-left';
    const rowJustify = align === 'right' ? 'justify-end' : 'justify-start';

    const labelCls = isSm
        ? 'text-[10px] font-medium text-zinc-400 mb-1'
        : isLg
        ? 'text-[12px] font-bold text-zinc-500 mb-1.5'
        : 'text-[11px] font-bold text-zinc-400 mb-1';

    const wonCls = isSm ? 'text-base font-bold text-[#7A4FFF]' : isLg ? 'text-xl font-bold text-[#7A4FFF]' : 'text-lg font-bold text-[#7A4FFF]';
    const numCls = isSm
        ? 'text-xl font-bold text-zinc-950 tabular-nums tracking-tighter'
        : isLg
        ? 'text-3xl font-black text-zinc-950 tabular-nums tracking-tighter'
        : 'text-2xl font-bold text-zinc-950 tabular-nums tracking-tighter';
    const unitCls = isSm
        ? 'text-xs font-medium text-zinc-400 ml-0.5'
        : isLg
        ? 'text-base font-bold text-zinc-500 ml-1.5'
        : 'text-sm font-medium text-zinc-400 ml-1';

    return (
        <div className={`${rootAlign} ${className}`}>
            {showLabel && <span className={`block ${labelCls}`}>예상 예산</span>}
            {man != null ? (
                <div className={`flex flex-wrap items-baseline gap-0.5 ${rowJustify}`}>
                    <span className={`${wonCls} leading-none`}>₩</span>
                    <span className={`${numCls} leading-none`}>{man}</span>
                    <span className={`${unitCls} leading-none`}>만원</span>
                </div>
            ) : (
                <p className={isSm ? 'text-lg font-bold text-zinc-400' : 'text-xl font-bold text-zinc-400'}>협의</p>
            )}
        </div>
    );
}
