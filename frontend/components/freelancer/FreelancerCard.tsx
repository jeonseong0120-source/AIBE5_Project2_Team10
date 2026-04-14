'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { FreelancerProfile } from '@/types/freelancer';

interface Props {
    data: FreelancerProfile;
}

export default function FreelancerCard({ data }: Props) {
    // [수정] 무한 루프 에러를 막기 위해 안전한 Fallback URL 상수화 및 브랜드 컬러 적용
    const FALLBACK_IMAGE_URL = "https://ui-avatars.com/api/?name=Agent&background=F4F4F5&color=A1A1AA&size=150";

    return (
        <Link href={`/freelancer/${data.id}`}>
            <motion.div
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
            >
                {/* 상단 이미지 */}
                <div className="h-36 bg-gradient-to-br from-zinc-100 to-zinc-200">
                    <img
                        src={data.profileImageUrl || FALLBACK_IMAGE_URL}
                        alt={data.nickname}
                        onError={(e) => { 
                            // [핵심] 이미지가 깨졌을 때 Fallback 이미지로 교체하되, 
                            // 교체한 이미지마저 깨지면 무한루프에 빠지지 않도록 방어 코드 추가!
                            if (e.currentTarget.src !== FALLBACK_IMAGE_URL) {
                                e.currentTarget.src = FALLBACK_IMAGE_URL; 
                            }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                </div>

                <div className="p-4">
                    {/* 이름 + 평점 */}
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-zinc-900 tracking-tight">{data.nickname}</h3>

                        <div className="flex items-center text-[#FF7D00] text-sm font-bold">
                            <Star size={14} fill="currentColor" />
                            <span className="ml-1 font-mono">{data.averageRating.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* 소개 */}
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                        {data.introduction}
                    </p>

                    {/* 스킬 */}
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

                    {/* 하단 */}
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
