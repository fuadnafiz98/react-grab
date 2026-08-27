import type { Plugin } from "../../types.js";
import { createElementSelector } from "../../utils/create-element-selector.js";
import { findSelectorTarget } from "../../utils/find-selector-target.js";
import { getTagName } from "../../utils/get-tag-name.js";
import { addCommentHistoryItem } from "./comment-history-store.js";

export const commentHistoryPlugin: Plugin = {
  name: "fork-comment-history",
  setup: (api) => ({
    hooks: {
      onCopySuccess: (elements, content, context) => {
        const commentText = context.prompt?.trim();
        if (!commentText || elements.length === 0) return;
        const primaryElement = elements[0];
        const componentName = api.getDisplayName(primaryElement) ?? undefined;
        const elementSelectors = elements.map((element) => {
          try {
            return createElementSelector(findSelectorTarget(element));
          } catch {
            return "";
          }
        });

        addCommentHistoryItem({
          content,
          tagName: getTagName(primaryElement) ?? "div",
          componentName,
          elementsCount: elements.length,
          elementSelectors,
          commentText,
          timestamp: Date.now(),
        });
      },
    },
  }),
};
