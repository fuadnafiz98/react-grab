import { generateId } from "../../utils/generate-id.js";
import {
  COMMENT_HISTORY_STORAGE_KEY,
  MAX_COMMENT_HISTORY_ITEMS,
  MAX_COMMENT_HISTORY_STORAGE_BYTES,
} from "./constants.js";
import type { AddCommentHistoryItemOptions, CommentHistoryItem } from "./types.js";

interface LegacyCommentHistoryItem {
  id?: unknown;
  content?: unknown;
  tagName?: unknown;
  componentName?: unknown;
  elementName?: unknown;
  elementsCount?: unknown;
  elementSelectors?: unknown;
  commentText?: unknown;
  timestamp?: unknown;
}

const listeners = new Set<(items: CommentHistoryItem[]) => void>();
let commentHistoryItems: CommentHistoryItem[] | null = null;

const normalizeStoredItem = (item: LegacyCommentHistoryItem): CommentHistoryItem | null => {
  if (typeof item.content !== "string" || typeof item.commentText !== "string") return null;
  if (
    typeof item.tagName !== "string" ||
    typeof item.timestamp !== "number" ||
    !Number.isFinite(item.timestamp)
  )
    return null;

  const componentName =
    typeof item.componentName === "string"
      ? item.componentName
      : typeof item.elementName === "string"
        ? item.elementName
        : undefined;

  return {
    id: typeof item.id === "string" ? item.id : generateId("comment"),
    content: item.content,
    tagName: item.tagName,
    componentName,
    elementsCount:
      typeof item.elementsCount === "number" && Number.isFinite(item.elementsCount)
        ? Math.max(1, Math.floor(item.elementsCount))
        : 1,
    elementSelectors: Array.isArray(item.elementSelectors)
      ? item.elementSelectors.filter(
          (elementSelector): elementSelector is string => typeof elementSelector === "string",
        )
      : [],
    commentText: item.commentText,
    timestamp: item.timestamp,
  };
};

const readCommentHistory = (): CommentHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const serializedItems = sessionStorage.getItem(COMMENT_HISTORY_STORAGE_KEY);
    if (!serializedItems) return [];
    const parsedItems: unknown = JSON.parse(serializedItems);
    if (!Array.isArray(parsedItems)) return [];
    return parsedItems
      .map((item) => normalizeStoredItem(item))
      .filter((item): item is CommentHistoryItem => item !== null)
      .slice(0, MAX_COMMENT_HISTORY_ITEMS);
  } catch {
    return [];
  }
};

const getCommentHistoryItems = (): CommentHistoryItem[] => {
  commentHistoryItems ??= readCommentHistory();
  return commentHistoryItems;
};

const trimCommentHistoryToStorageLimit = (items: CommentHistoryItem[]): CommentHistoryItem[] => {
  let trimmedItems = items;
  while (trimmedItems.length > 0) {
    const serializedItems = JSON.stringify(trimmedItems);
    if (new Blob([serializedItems]).size <= MAX_COMMENT_HISTORY_STORAGE_BYTES) {
      return trimmedItems;
    }
    trimmedItems = trimmedItems.slice(0, -1);
  }
  return [];
};

const persistCommentHistory = (items: CommentHistoryItem[]): CommentHistoryItem[] => {
  commentHistoryItems = trimCommentHistoryToStorageLimit(items);
  try {
    sessionStorage.setItem(COMMENT_HISTORY_STORAGE_KEY, JSON.stringify(commentHistoryItems));
  } catch {}
  for (const listener of listeners) listener(commentHistoryItems);
  return commentHistoryItems;
};

const haveMatchingSelections = (firstSelectors: string[], secondSelectors: string[]): boolean =>
  firstSelectors.length === secondSelectors.length &&
  firstSelectors.every((selector, selectorIndex) => selector === secondSelectors[selectorIndex]);

export const loadCommentHistory = (): CommentHistoryItem[] => [...getCommentHistoryItems()];

export const addCommentHistoryItem = (
  options: AddCommentHistoryItemOptions,
): CommentHistoryItem[] => {
  const itemsWithoutDuplicate = getCommentHistoryItems().filter(
    (item) =>
      item.commentText !== options.commentText ||
      !haveMatchingSelections(item.elementSelectors, options.elementSelectors),
  );
  return persistCommentHistory(
    [{ ...options, id: generateId("comment") }, ...itemsWithoutDuplicate].slice(
      0,
      MAX_COMMENT_HISTORY_ITEMS,
    ),
  );
};

export const removeCommentHistoryItem = (itemId: string): CommentHistoryItem[] =>
  persistCommentHistory(getCommentHistoryItems().filter((item) => item.id !== itemId));

export const clearCommentHistory = (): CommentHistoryItem[] => persistCommentHistory([]);

export const subscribeToCommentHistory = (
  listener: (items: CommentHistoryItem[]) => void,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
