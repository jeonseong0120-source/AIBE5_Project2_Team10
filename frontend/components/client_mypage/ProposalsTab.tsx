'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/axios';
import { motion } from 'framer-motion';
import { Send, User, Calendar, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ProposalDto {
    proposalId: number;
    projectId: number;
    projectName: string;
    freelancerProfileId: number;
    freelancerName: string;
    offeredPrice: number;
    message: string;
    status: string;
    statusDescription: string;
    createdAt: string;
}

export default function ProposalsTab() {
    const [proposals, setProposals] = useState<ProposalDto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/v1/proposals/sent');
            setProposals(data || []);
        } catch (err) {
            console.error("제안 목록 조회 실패", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle2 className="text-green-500" size={14} />;
            case 'REJECTED': return <XCircle className="text-red-500" size={14} />;
            default: return <Clock className="text-orange-500" size={14} />;
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-50 border-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-50 border-red-100 text-red-700';
            default: return 'bg-orange-50 border-orange-100 text-orange-700';
        }
    };

    if (loading) return <div className="py-24 flex justify-center"><Clock className="animate-spin text-[#FF7D00]" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-black uppercase font-mono tracking-[0.3em] text-zinc-400">Scout_Proposals</h2>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase mt-1 italic">Manage your direct offers to top-tier talent</p>
                </div>
                <span className="px-4 py-1.5 bg-zinc-950 text-white text-[10px] font-black rounded-full font-mono shadow-lg">SENT_{proposals.length}</span>
            </div>

            {proposals.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {proposals.map((proposal, idx) => (
                        <motion.div
                            key={proposal.proposalId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-zinc-50/50 p-8 rounded-[2.5rem] border border-zinc-100 transition-all hover:bg-white hover:shadow-2xl hover:border-[#FF7D00]/20"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black font-mono shadow-sm ${getStatusBg(proposal.status)}`}>
                                            {getStatusIcon(proposal.status)}
                                            {proposal.statusDescription}
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-300 font-mono italic">#{proposal.proposalId}</span>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                                            <Send size={18} className="text-[#FF7D00]" /> {proposal.projectName}
                                        </h3>
                                        <p className="text-sm font-medium text-zinc-400 mt-1 flex items-center gap-2">
                                            To: <span className="text-zinc-900 font-black">{proposal.freelancerName}</span>
                                        </p>
                                    </div>

                                    <div className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-inner">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase font-mono mb-2 flex items-center gap-2"><MessageSquare size={12} /> Message_Brief</p>
                                        <p className="text-sm text-zinc-600 italic leading-relaxed">"{proposal.message}"</p>
                                    </div>
                                </div>

                                <div className="md:w-64 space-y-4">
                                    <div className="p-6 bg-zinc-900 text-white rounded-2xl shadow-xl">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase font-mono mb-1">Offered_Price</p>
                                        <p className="text-xl font-black font-mono italic">₩{proposal.offeredPrice.toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 bg-white rounded-2xl border border-zinc-100">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase font-mono mb-1">Sent_Date</p>
                                        <p className="text-xs font-bold text-zinc-600 flex items-center gap-2"><Calendar size={12} /> {new Date(proposal.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-40 bg-zinc-50/50 rounded-[3rem] border-4 border-dashed border-zinc-100 font-mono font-black text-zinc-200 italic uppercase text-xl tracking-widest">Null: No_Scouts_Detected</div>
            )}
        </div>
    );
}
