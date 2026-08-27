import type { CommentHistoryItem } from "./types.js";

export const joinCommentHistory = (items: CommentHistoryItem[]): string =>
  items.map((item, itemIndex) => `[${itemIndex + 1}]\n${item.content}`).join("\n\n");
