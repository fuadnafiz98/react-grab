import type { Component } from "solid-js";
import { COMMENT_HISTORY_ICON_SIZE_PX } from "./constants.js";

interface IconCommentHistoryProps {
  size?: number;
  class?: string;
}

export const IconCommentHistory: Component<IconCommentHistoryProps> = (props) => {
  const size = () => props.size ?? COMMENT_HISTORY_ICON_SIZE_PX;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      class={props.class}
    >
      <path
        d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v7.5A2.75 2.75 0 0 1 16.25 16H11l-4.35 3.48A1 1 0 0 1 5 18.7V16.3a2.75 2.75 0 0 1-2-2.65v-7.9A2.75 2.75 0 0 1 5 5.75Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path d="M8 8h8M8 11.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
  );
};
