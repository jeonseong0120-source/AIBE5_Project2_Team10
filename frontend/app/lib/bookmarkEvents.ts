import api from './axios';

export const DEVNEAR_BOOKMARK_CHANGED = "devnear-bookmark-changed";

export interface BookmarkChangeEventDetail {
    projectId: number;
    isBookmarked: boolean;
}

// In-memory cache to preserve optimistic UI state across component mounts
const localBookmarkCache = new Map<number, boolean>();

export function getLocalBookmarkState(projectId: number): boolean | undefined {
    return localBookmarkCache.get(projectId);
}

export function notifyBookmarkChanged(projectId: number, isBookmarked: boolean): void {
    localBookmarkCache.set(projectId, isBookmarked);
    if (typeof window !== "undefined") {
        const event = new CustomEvent<BookmarkChangeEventDetail>(DEVNEAR_BOOKMARK_CHANGED, {
            detail: { projectId, isBookmarked }
        });
        window.dispatchEvent(event);
    }
}
