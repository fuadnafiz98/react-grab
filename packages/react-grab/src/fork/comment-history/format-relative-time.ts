import { DAY_MS, HOUR_MS, MINUTE_MS } from "./constants.js";

export const formatCommentHistoryRelativeTime = (timestamp: number): string => {
  const elapsedMs = Math.max(0, Date.now() - timestamp);
  if (elapsedMs < MINUTE_MS) return "now";
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}m`;
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)}h`;
  return `${Math.floor(elapsedMs / DAY_MS)}d`;
};
