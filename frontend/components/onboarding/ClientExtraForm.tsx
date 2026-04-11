"use client";

import { motion } from "framer-motion";

interface ClientExtraFormProps {
    clientData: {
        companyName: string;
        representativeName: string;
        bn: string;
        introduction: string;
        homepageUrl: string;
        phoneNum: string;
    };
    setClientData: (data: any) => void;
}

export default function ClientExtraForm({ clientData, setClientData }: ClientExtraFormProps) {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
        >
            <div className="pt-6 mt-6 border-t border-zinc-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#FF7D00] rounded-full"></span>
                    <p className="text-[10px] font-black text-[#FF7D00] uppercase tracking-widest">Business Information</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Company Name *</label>
                        <input
                            value={clientData.companyName}
                            onChange={(e) => setClientData({ ...clientData, companyName: e.target.value })}
                            placeholder="회사명 또는 활동명"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Representative *</label>
                        <input
                            value={clientData.representativeName}
                            onChange={(e) => setClientData({ ...clientData, representativeName: e.target.value })}
                            placeholder="대표자 성함"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Business Number (BN) *</label>
                    <input
                        value={clientData.bn}
                        onChange={(e) => setClientData({ ...clientData, bn: e.target.value })}
                        placeholder="사업자 등록번호 (10자리)"
                        className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Introduction</label>
                    <textarea
                        value={clientData.introduction}
                        onChange={(e) => setClientData({ ...clientData, introduction: e.target.value })}
                        placeholder="의뢰인 또는 기업에 대해 짧게 소개해 주세요."
                        className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all min-h-[100px] resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Phone</label>
                        <input
                            value={clientData.phoneNum}
                            onChange={(e) => setClientData({ ...clientData, phoneNum: e.target.value })}
                            placeholder="010-0000-0000"
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 ml-1 uppercase">Homepage</label>
                        <input
                            value={clientData.homepageUrl}
                            onChange={(e) => setClientData({ ...clientData, homepageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-[#FF7D00] outline-none transition-all"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}