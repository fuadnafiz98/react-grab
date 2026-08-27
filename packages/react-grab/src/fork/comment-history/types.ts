export interface CommentHistoryItem {
  id: string;
  content: string;
  tagName: string;
  componentName?: string;
  elementsCount: number;
  elementSelectors: string[];
  commentText: string;
  timestamp: number;
}

export interface AddCommentHistoryItemOptions {
  content: string;
  tagName: string;
  componentName?: string;
  elementsCount: number;
  elementSelectors: string[];
  commentText: string;
  timestamp: number;
}
