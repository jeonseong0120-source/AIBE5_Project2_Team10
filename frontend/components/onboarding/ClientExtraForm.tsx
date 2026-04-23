"use client";

import { motion } from "framer-motion";
import { Building2, User, FileText, Info, Phone, Globe } from "lucide-react";

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
    const inputStyle = "w-full pl-12 pr-4 py-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl outline-none transition-all font-bold text-sm focus:ring-4 focus:ring-[#FF7D00]/10 focus:border-[#FF7D00] focus:bg-white";
    const labelStyle = "text-[10px] font-black text-zinc-400 ml-1 uppercase tracking-widest block mb-2 cursor-pointer"; // 🎯 클릭 가능함을 알리기 위해 cursor-pointer 추가

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
        >
            <div className="pt-8 mt-8 border-t border-zinc-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-[#FF7D00] rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-[#FF7D00] uppercase tracking-[0.2em]">Business Information</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                        {/* 🎯 htmlFor와 id를 매칭하여 연결 */}
                        <label htmlFor="companyName" className={labelStyle}>Company Name *</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                            <input
                                id="companyName"
                                value={clientData.companyName}
                                onChange={(e) => setClientData({ ...clientData, companyName: e.target.value })}
                                placeholder="회사명 또는 활동명"
                                className={inputStyle}
                                required
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label htmlFor="representativeName" className={labelStyle}>Representative *</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                            <input
                                id="representativeName"
                                value={clientData.representativeName}
                                onChange={(e) => setClientData({ ...clientData, representativeName: e.target.value })}
                                placeholder="대표자 성함"
                                className={inputStyle}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label htmlFor="bn" className={labelStyle}>Business Number (BN) *</label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                        <input
                            id="bn"
                            value={clientData.bn}
                            onChange={(e) => setClientData({ ...clientData, bn: e.target.value })}
                            placeholder="사업자 등록번호 (10자리)"
                            className={inputStyle}
                            required
                        />
                    </div>
                </div>

                <div className="group">
                    <label htmlFor="introduction" className={labelStyle}>Introduction</label>
                    <div className="relative">
                        <Info className="absolute left-4 top-4 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                        <textarea
                            id="introduction"
                            value={clientData.introduction}
                            onChange={(e) => setClientData({ ...clientData, introduction: e.target.value })}
                            placeholder="의뢰인 또는 기업에 대해 짧게 소개해 주세요."
                            className={`${inputStyle} min-h-[120px] resize-none py-4`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                        <label htmlFor="phoneNum" className={labelStyle}>Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                            <input
                                id="phoneNum"
                                value={clientData.phoneNum}
                                onChange={(e) => setClientData({ ...clientData, phoneNum: e.target.value })}
                                placeholder="010-0000-0000"
                                className={inputStyle}
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label htmlFor="homepageUrl" className={labelStyle}>Homepage</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF7D00] transition-colors" size={18} />
                            <input
                                id="homepageUrl"
                                value={clientData.homepageUrl}
                                onChange={(e) => setClientData({ ...clientData, homepageUrl: e.target.value })}
                                placeholder="https://..."
                                className={inputStyle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}