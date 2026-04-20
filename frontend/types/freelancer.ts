// 1. 기초가 되는 스킬 인터페이스 정의 (이게 없어서 TS2304 에러 발생)
export interface Skill {
    id: number;
    name: string;
}

export interface ApiSkill {
    skillId: number;
    name: string;
}

// 2. 프론트엔드 내부에서 사용할 정제된 인터페이스
export interface FreelancerProfile {
    id: number;
    userId?: number;
    nickname: string;
    profileImageUrl?: string;
    /** 포트폴리오에서 모은 미리보기 이미지 URL (목록 API 등) */
    portfolioImageUrls?: string[];
    introduction: string;
    location: string;
    hourlyRate: number;
    workStyle: 'ONLINE' | 'OFFLINE' | 'HYBRID';
    skills: Skill[];
    averageRating: number;
    completedProjects?: number; // 상세 페이지용 추가
    isBookmarked?: boolean;
}

// 3. 백엔드 API 응답(DTO) 형태
export interface ApiFreelancerDto {
    profileId: number;
    userId?: number;
    userName: string;
    profileImageUrl?: string;
    portfolioImageUrls?: string[];
    introduction: string;
    location: string;
    hourlyRate: number;
    workStyle: 'ONLINE' | 'OFFLINE' | 'HYBRID';
    skills: ApiSkill[];
    averageRating: number | null;
    completedProjects?: number; // 상세 페이지용 추가
}

// 4. 매퍼 함수
export function mapFreelancerDtoToProfile(dto: ApiFreelancerDto): FreelancerProfile {
    return {
        id: dto.profileId,
        userId: dto.userId,
        nickname: dto.userName,
        profileImageUrl: dto.profileImageUrl,
        portfolioImageUrls: dto.portfolioImageUrls ?? [],
        introduction: dto.introduction,
        location: dto.location,
        hourlyRate: dto.hourlyRate,
        workStyle: dto.workStyle,
        skills: dto.skills ? dto.skills.map(skill => ({
            id: skill.skillId,
            name: skill.name,
        })) : [],
        averageRating: dto.averageRating ?? 0,
        completedProjects: dto.completedProjects ?? 0,
    };
}