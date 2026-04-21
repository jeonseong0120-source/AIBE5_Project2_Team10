'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/axios';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const confirmPayment = async () => {
            if (!paymentKey || !orderId || !amount) {
                setStatus('ERROR');
                setErrorMessage('잘못된 접근입니다. 결제 정보가 누락되었습니다.');
                return;
            }

            try {
                // 백엔드로 최종 승인 요청
                await api.post('/v1/payments/confirm', {
                    paymentKey,
                    orderId,
                    amount: Number(amount)
                });
                setStatus('SUCCESS');
            } catch (err: any) {
                console.error('Payment confirmation error:', err);
                setStatus('ERROR');
                setErrorMessage(err.response?.data?.message || '결제 승인 중 오류가 발생했습니다.');
            }
        };

        confirmPayment();
    }, [paymentKey, orderId, amount]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-2xl border border-zinc-100 flex flex-col items-center max-w-md w-full text-center"
            >
                {status === 'LOADING' && (
                    <>
                        <Loader2 className="w-16 h-16 text-[#FF7D00] animate-spin mb-6" />
                        <h2 className="text-2xl font-black text-zinc-900 mb-2 uppercase font-mono tracking-tight">결제 승인 중...</h2>
                        <p className="text-zinc-500 text-sm">안전하게 결제 내역을 확인하고 있습니다. 잠시만 기다려주세요.</p>
                    </>
                )}

                {status === 'SUCCESS' && (
                    <>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">예치금 결제 완료!</h2>
                        <p className="text-zinc-500 text-sm mb-8">프로젝트가 안전하게 시작되었습니다. 대시보드에서 진행 상황을 확인하세요.</p>
                        <button 
                            onClick={() => router.replace('/client/dashboard')}
                            className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black text-sm hover:bg-[#FF7D00] transition-all uppercase tracking-widest font-mono shadow-md"
                        >
                            대시보드로 돌아가기
                        </button>
                    </>
                )}

                {status === 'ERROR' && (
                    <>
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">결제 승인 실패</h2>
                        <p className="text-red-500 text-sm mb-8 bg-red-50 p-4 rounded-xl">{errorMessage}</p>
                        <button 
                            onClick={() => router.replace('/client/dashboard')}
                            className="w-full py-4 bg-zinc-100 text-zinc-700 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all uppercase tracking-widest font-mono"
                        >
                            대시보드로 돌아가기
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF7D00]"/></div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
