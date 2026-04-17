'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import { FreelancerProfile } from '@/types/freelancer';

interface Props {
    data: FreelancerProfile;
}

export default function FreelancerCard({ data }: Props) {
    const FALLBACK_IMAGE_URL = "https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150";

    const slides = useMemo(() => {
        const fromPortfolio = (data.portfolioImageUrls ?? []).filter(Boolean);
        if (fromPortfolio.length > 0) return fromPortfolio;
        return [data.profileImageUrl || FALLBACK_IMAGE_URL];
    }, [data.portfolioImageUrls, data.profileImageUrl]);

    const [slideIndex, setSlideIndex] = useState(0);

    useEffect(() => {
        setSlideIndex(0);
    }, [data.id, slides.join('|')]);

    const goPrev = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
        },
        [slides.length]
    );

    const goNext = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setSlideIndex((i) => (i + 1) % slides.length);
        },
        [slides.length]
    );

    const showArrows = slides.length > 1;
    const currentSrc = slides[slideIndex] ?? FALLBACK_IMAGE_URL;

    return (
        <Link href={`/freelancer/${data.id}`}>
            <motion.div
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
            >
                <div className="group/carousel relative h-36 bg-gradient-to-br from-zinc-100 to-zinc-200 overflow-hidden">
                    <img
                        src={currentSrc}
                        alt={data.nickname}
                        onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                e.currentTarget.src = FALLBACK_IMAGE_URL;
                            }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {showArrows && (
                        <>
                            <button
                                type="button"
                                aria-label="이전 이미지"
                                onClick={goPrev}
                                className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md opacity-0 pointer-events-none transition-opacity duration-200 group-hover/carousel:pointer-events-auto group-hover/carousel:opacity-100 hover:bg-white"
                            >
                                <ChevronLeft size={20} strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                aria-label="다음 이미지"
                                onClick={goNext}
                                className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-md opacity-0 pointer-events-none transition-opacity duration-200 group-hover/carousel:pointer-events-auto group-hover/carousel:opacity-100 hover:bg-white"
                            >
                                <ChevronRight size={20} strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-zinc-900 tracking-tight">{data.nickname}</h3>

                        <div className="flex items-center text-[#FF7D00] text-sm font-bold">
                            <Star size={14} fill="currentColor" />
                            <span className="ml-1 font-mono">{data.averageRating.toFixed(1)}</span>
                        </div>
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                        {data.introduction}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                        {data.skills.slice(0, 3).map((skill) => (
                            <span
                                key={skill.id}
                                className="px-2 py-0.5 text-[10px] rounded-md bg-orange-50 text-[#FF7D00] border border-orange-100 font-semibold font-mono uppercase"
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-100 text-xs text-zinc-500 font-mono font-bold">
                        <div className="flex items-center">
                            <MapPin size={12} className="mr-1 text-zinc-400"/>
                            {data.location}
                        </div>

                        <div className="text-[#7A4FFF]">
                            ₩{data.hourlyRate.toLocaleString()}
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
