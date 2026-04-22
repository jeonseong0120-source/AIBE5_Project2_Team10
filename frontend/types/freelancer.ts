// 1. 기초가 되는 스킬 인터페이스 정의
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
    completedProjects?: number;
    gradeName?: string;
    // 🎯 속성 추가
    isBookmarked: boolean;
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
    completedProjects?: number;
    gradeName?: string;
    // 🎯 [수정] 서버에서 내려주는 북마크 필드 추가 (camelCase, snakeCase 둘 다 대비)
    isBookmarked?: boolean;
    is_bookmarked?: boolean;
}

// 4. 매퍼 함수 (통역사)
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
        gradeName: dto.gradeName,

        // 🎯 [핵심 수정] 서버 데이터를 프론트엔드 속성에 연결!!
        // dto.isBookmarked 또는 dto.is_bookmarked 중 있는 값을 쓰고 없으면 false
        isBookmarked: dto.isBookmarked ?? dto.is_bookmarked ?? false,
    };
}

export interface ReviewResponse {
    id: number;
    averageScore: number;
    comment: string;
    workQuality?: number;
    deadline?: number;
    communication?: number;
    expertise?: number;
    requirementClarity?: number;
    paymentReliability?: number;
    workAttitude?: number;
    reviewerNickname: string;
    reviewerProfileImageUrl?: string;
    createdAt: string;
}

export interface ProjectHistoryDto {
    projectId: number;
    companyName: string;
    projectName: string;
    budget: number;
    deadline: string;
    status: string;
    location: string;
    logoUrl?: string;
    skills: string[];
}