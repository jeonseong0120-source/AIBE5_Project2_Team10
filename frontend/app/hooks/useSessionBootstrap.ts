"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/app/lib/axios";
import { getActiveRole } from "@/app/lib/auth";

export function useSessionBootstrap() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const bootstrap = useCallback(async () => {
        try {
            setLoading(true);
            const userRes = await api.get("/v1/users/me");
            setUser(userRes.data);
            
            const roles = userRes.data.role || "";
            const currentRole = getActiveRole();

            if (roles === "BOTH") {
                if (currentRole === "CLIENT") {
                    const pRes = await api.get("/client/profile");
                    setProfile(pRes.data);
                } else {
                    const pRes = await api.get("/v1/freelancers/me");
                    setProfile(pRes.data);
                }
            } else if (roles === "CLIENT") {
                const pRes = await api.get("/client/profile");
                setProfile(pRes.data);
            } else if (roles === "FREELANCER") {
                const pRes = await api.get("/v1/freelancers/me");
                setProfile(pRes.data);
            }
        } catch (err) {
            console.error("Session bootstrap failed:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    return { user, profile, loading, error, refreshSession: bootstrap };
}
