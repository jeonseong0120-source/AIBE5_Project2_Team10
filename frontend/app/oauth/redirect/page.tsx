"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ShieldCheck, Network, Cpu, Lock } from "lucide-react";
import api from "../../lib/axios";
import { notifyAuthChanged } from "../../lib/authEvents";
import { postLoginPathForRole } from "../../lib/postLoginRedirect";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } }
};

export default function OAuthRedirect() {
    const router = useRouter();
    const [status, setStatus] = useState("SYNCHRONIZING");

    useEffect(() => {
        const processLogin = async () => {
            const hash = window.location.hash;
            if (hash) {
                const params = new URLSearchParams(hash.slice(1));
                const token = params.get("token");
                if (token) {
                    localStorage.setItem("accessToken", token);
                    notifyAuthChanged();
                    setStatus("VALIDATING");
                    try {
                        const res = await api.get("/v1/users/me");
                        setStatus("AUTHORIZED");
                        setTimeout(() => { router.replace(postLoginPathForRole(res.data.role)); }, 800);
                    } catch (err) { router.replace("/?error=auth_failed"); }
                } else { router.replace("/?error=token_missing"); }
            } else { router.replace("/?error=invalid_access"); }
        };
        processLogin();
    }, [router]);

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative min-h-screen bg-zinc-50 flex items-center justify-center font-sans overflow-hidden">
            <div className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#7A4FFF] opacity-[0.05] blur-[120px] rounded-full" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#FF7D00] opacity-[0.05] blur-[120px] rounded-full" />

            <motion.div variants={cardVariants} className="relative z-10 w-full max-w-sm mx-4">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF7D00] via-[#7A4FFF] to-[#FF7D00] animate-[gradient_3s_linear_infinite]" />
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-[#7A4FFF]/10 rounded-full" />
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-t-[#7A4FFF] border-transparent rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            {status === "AUTHORIZED" ? <ShieldCheck size={32} className="text-[#FF7D00]" /> : <Cpu size={28} className="text-[#7A4FFF] animate-pulse" />}
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">보안 인증 중</h2>
                    <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-md block w-fit mx-auto mt-2">Protocol: {status}</span>
                    <div className="mt-10 pt-6 border-t border-zinc-50 flex justify-center gap-6">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-300 font-mono"><Lock size={10} /> ENCRYPTED</div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-300 font-mono"><Network size={10} /> LINKED</div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}