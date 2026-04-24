import api from './axios';

export const DEVNEAR_BOOKMARK_CHANGED = "devnear-bookmark-changed";

export interface BookmarkChangeEventDetail {
    projectId: number;
    isBookmarked: boolean;
}

class BoundedLRUCache<K, V> {
    private cache = new Map<K, V>();
    private readonly maxCapacity: number;

    constructor(maxCapacity: number = 500) {
        this.maxCapacity = maxCapacity;
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        const value = this.cache.get(key)!;
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxCapacity) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

// Bounded in-memory cache to preserve optimistic UI state across component mounts
const localBookmarkCache = new BoundedLRUCache<number, boolean>(500);

export function clearLocalBookmarkCache(): void {
    localBookmarkCache.clear();
}

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
