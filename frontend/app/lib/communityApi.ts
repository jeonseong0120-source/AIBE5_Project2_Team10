import api from "./axios";
import type {
    CommunityPost,
    CommunityPostPageResponse,
    CommunityComment,
    CommunityPostCreateRequest,
    CommunityPostUpdateRequest,
    CommunityCommentCreateRequest,
    CommunitySuccessResponse,
    CommunityLikeResponse,
} from "@/types/community";

export async function getCommunityPosts(
    page = 0,
    size = 10,
    keyword = "",
    sort = "latest"
): Promise<CommunityPostPageResponse> {
    const { data } = await api.get<CommunityPostPageResponse>("/community/posts", {
        params: {
            page,
            size,
            keyword: keyword || undefined,
            sort,
        },
    });
    return data;
}

export async function getCommunityPostDetail(postId: number): Promise<CommunityPost> {
    const { data } = await api.get<CommunityPost>(`/community/posts/${postId}`);
    return data;
}

export async function createCommunityPost(
    body: CommunityPostCreateRequest
): Promise<number> {
    const { data } = await api.post<number>("/community/posts", body);
    return data;
}

export async function updateCommunityPost(
    postId: number,
    body: CommunityPostUpdateRequest
): Promise<CommunitySuccessResponse> {
    const { data } = await api.put<CommunitySuccessResponse>(
        `/community/posts/${postId}`,
        body
    );
    return data;
}

export async function deleteCommunityPost(
    postId: number
): Promise<CommunitySuccessResponse> {
    const { data } = await api.delete<CommunitySuccessResponse>(
        `/community/posts/${postId}`
    );
    return data;
}

export async function getCommunityComments(
    postId: number
): Promise<CommunityComment[]> {
    const { data } = await api.get<CommunityComment[]>(
        `/community/posts/${postId}/comments`
    );
    return data;
}

export async function createCommunityComment(
    body: CommunityCommentCreateRequest
): Promise<number> {
    const { data } = await api.post<number>("/community/comments", body);
    return data;
}

export async function likeCommunityPost(
    postId: number
): Promise<CommunityLikeResponse> {
    const { data } = await api.post<CommunityLikeResponse>(
        `/community/posts/${postId}/like`
    );
    return data;
}

export async function unlikeCommunityPost(
    postId: number
): Promise<CommunityLikeResponse> {
    const { data } = await api.delete<CommunityLikeResponse>(
        `/community/posts/${postId}/like`
    );
    return data;
}