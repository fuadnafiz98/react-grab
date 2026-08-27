import { For, Show, createSignal, onCleanup, type Component } from "solid-js";
import type { DropdownAnchor } from "../../types.js";
import { copyContent } from "../../utils/copy-content.js";
import { Surface } from "../../components/ui/surface.js";
import { AnchoredDropdownSurface } from "../../components/ui/anchored-dropdown-surface.js";
import { Button } from "../../components/ui/button.js";
import { IconCheck } from "../../components/icons/icon-check.js";
import { clearCommentHistory, removeCommentHistoryItem } from "./comment-history-store.js";
import {
  COMMENT_HISTORY_DROPDOWN_MAX_HEIGHT_PX,
  COMMENT_HISTORY_DROPDOWN_MAX_WIDTH_PX,
  COMMENT_HISTORY_DROPDOWN_MIN_WIDTH_PX,
  COMMENT_HISTORY_FEEDBACK_DURATION_MS,
  COMMENT_HISTORY_FEEDBACK_ICON_SIZE_PX,
} from "./constants.js";
import { formatCommentHistoryRelativeTime } from "./format-relative-time.js";
import { joinCommentHistory } from "./join-comment-history.js";
import type { CommentHistoryItem } from "./types.js";

interface CommentHistoryDropdownProps {
  position: DropdownAnchor | null;
  items: CommentHistoryItem[];
  onDismiss: () => void;
}

export const CommentHistoryDropdown: Component<CommentHistoryDropdownProps> = (props) => {
  const [didCopyAll, setDidCopyAll] = createSignal(false);
  let copyFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  const copyAllComments = () => {
    if (props.items.length === 0) return;
    if (!copyContent(joinCommentHistory(props.items))) return;
    setDidCopyAll(true);
    clearTimeout(copyFeedbackTimeout);
    copyFeedbackTimeout = setTimeout(
      () => setDidCopyAll(false),
      COMMENT_HISTORY_FEEDBACK_DURATION_MS,
    );
  };

  onCleanup(() => clearTimeout(copyFeedbackTimeout));

  return (
    <AnchoredDropdownSurface
      position={props.position}
      dataAttribute="data-react-grab-comment-history"
      onDismiss={props.onDismiss}
    >
      <Surface
        class="overflow-hidden"
        style={{
          width: `${COMMENT_HISTORY_DROPDOWN_MIN_WIDTH_PX}px`,
          "max-width": `${COMMENT_HISTORY_DROPDOWN_MAX_WIDTH_PX}px`,
          "max-height": `${COMMENT_HISTORY_DROPDOWN_MAX_HEIGHT_PX}px`,
        }}
      >
        <div class="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 pb-1.5">
          <span class="text-[11px] font-medium text-[var(--rg-text-secondary)]">Comments</span>
          <div class="flex items-center gap-1">
            <Button
              data-react-grab-comment-history-clear
              variant="destructive"
              aria-label="Clear comments"
              onClick={() => {
                clearCommentHistory();
                props.onDismiss();
              }}
            >
              Clear
            </Button>
            <Button
              data-react-grab-comment-history-copy-all
              aria-label="Copy all comments"
              onClick={copyAllComments}
            >
              <Show when={didCopyAll()} fallback="Copy all">
                <IconCheck size={COMMENT_HISTORY_FEEDBACK_ICON_SIZE_PX} />
              </Show>
            </Button>
          </div>
        </div>
        <div class="min-h-0 overflow-x-hidden overflow-y-auto border-t border-[var(--rg-border-subtle)] py-1 [scrollbar-width:thin]">
          <div role="list" aria-label="Saved comments" class="relative flex flex-col">
            <For each={props.items}>
              {(item) => (
                <div
                  role="listitem"
                  data-react-grab-comment-history-item={item.id}
                  class="group flex items-center gap-1 px-1"
                >
                  <button
                    data-react-grab-ignore-events
                    data-react-grab-comment-history-copy={item.id}
                    type="button"
                    class="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 border-none bg-transparent px-1 py-1.5 text-left hover:bg-[var(--rg-surface-hover)]"
                    onClick={() => copyContent(item.content)}
                  >
                    <span class="flex min-w-0 flex-1 flex-col">
                      <span
                        class="truncate text-[12px] font-medium text-[var(--rg-text-primary)]"
                        textContent={
                          item.elementsCount > 1
                            ? `${item.elementsCount} elements`
                            : (item.componentName ?? item.tagName)
                        }
                      />
                      <span
                        class="mt-0.5 truncate text-[11px] text-[var(--rg-text-secondary)]"
                        textContent={item.commentText}
                      />
                    </span>
                    <span class="shrink-0 text-[10px] text-[var(--rg-text-secondary)]">
                      {formatCommentHistoryRelativeTime(item.timestamp)}
                    </span>
                  </button>
                  <button
                    data-react-grab-ignore-events
                    data-react-grab-comment-history-remove={item.id}
                    type="button"
                    aria-label={`Remove ${item.commentText}`}
                    class="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent text-[13px] opacity-0 transition-opacity hover:bg-[var(--rg-surface-hover)] group-hover:opacity-100 focus:opacity-100"
                    onClick={() => removeCommentHistoryItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Surface>
    </AnchoredDropdownSurface>
  );
};
