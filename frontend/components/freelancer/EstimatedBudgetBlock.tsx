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
    size?: 'sm' | 'md';
    /** 목록 카드는 오른쪽 정렬, 모달 통계 칸은 왼쪽 */
    align?: 'left' | 'right';
    className?: string;
};

/**
 * 예산 표기 통일: 우측 상단 "예상 예산" + ₩(주황) + 숫자(검정) + 만원(회색)
 */
export function EstimatedBudgetBlock({
    budgetWon,
    size = 'md',
    align = 'right',
    className = '',
}: Props) {
    const man = manWonFromBudget(budgetWon);
    const isSm = size === 'sm';

    const rootAlign = align === 'right' ? 'text-right' : 'text-left';
    const rowJustify = align === 'right' ? 'justify-end' : 'justify-start';

    const labelCls = isSm
        ? 'text-[10px] font-medium text-zinc-400 mb-1'
        : 'text-[11px] font-bold text-zinc-400 mb-1';

    const wonCls = isSm ? 'text-base font-bold text-[#FF7D00]' : 'text-lg font-bold text-[#FF7D00]';
    const numCls = isSm
        ? 'text-xl font-bold text-zinc-950 tabular-nums tracking-tighter'
        : 'text-2xl font-bold text-zinc-950 tabular-nums tracking-tighter';
    const unitCls = isSm
        ? 'text-xs font-medium text-zinc-400 ml-0.5'
        : 'text-sm font-medium text-zinc-400 ml-1';

    return (
        <div className={`${rootAlign} ${className}`}>
            <span className={`block ${labelCls}`}>예상 예산</span>
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
