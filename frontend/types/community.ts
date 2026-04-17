export interface CommunityPost {
    id: number;
    title: string;
    content: string;
    authorId: number;
    authorNickname?: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isLiked?: boolean;
    createdAt: string;
    updatedAt: string;

}

export interface CommunityPostPageResponse {
    content: CommunityPost[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface CommunityComment {
    id: number;
    postId: number;
    authorId: number;
    authorNickname?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface CommunityPostCreateRequest {
    title: string;
    content: string;
}

export interface CommunityPostUpdateRequest {
    title: string;
    content: string;
}

export interface CommunityCommentCreateRequest {
    postId: number;
    content: string;
}

export interface CommunitySuccessResponse {
    success: boolean;
}

export interface CommunityLikeResponse {
    success: boolean;
    likeCount: number;
}