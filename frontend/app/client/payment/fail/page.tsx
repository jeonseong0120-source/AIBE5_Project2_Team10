'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function PaymentFailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const code = searchParams.get('code') || 'UNKNOWN_ERROR';
    const message = searchParams.get('message') || '결제 처리 중 알 수 없는 오류가 발생했습니다.';

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-100 flex flex-col items-center max-w-md w-full text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                
                <h2 className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">결제 실패</h2>
                <p className="text-zinc-500 text-sm mb-6">결제를 정상적으로 완료하지 못했습니다.</p>
                
                <div className="bg-zinc-50 p-6 rounded-2xl w-full text-left border border-zinc-100 mb-8">
                    <p className="text-xs font-bold font-mono text-zinc-400 mb-1">오류 코드: {code}</p>
                    <p className="text-sm font-medium text-red-500 line-clamp-3">{decodeURIComponent(message)}</p>
                </div>

                <div className="flex flex-col w-full gap-3">
                    <button 
                        onClick={() => router.replace('/client/dashboard')}
                        className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black text-sm hover:bg-[#FF7D00] transition-all flex items-center justify-center gap-2 uppercase tracking-widest font-mono shadow-md"
                    >
                        <ArrowLeft size={18} /> 이전 화면으로 돌아가기
                    </button>
                    <button 
                        onClick={() => router.push('/support')}
                        className="w-full py-4 bg-white text-zinc-400 border border-zinc-200 rounded-2xl font-black text-sm hover:text-zinc-600 hover:bg-zinc-50 transition-all uppercase tracking-widest font-mono"
                    >
                        고객센터 문의
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF7D00]"/></div>}>
            <PaymentFailContent />
        </Suspense>
    );
}
