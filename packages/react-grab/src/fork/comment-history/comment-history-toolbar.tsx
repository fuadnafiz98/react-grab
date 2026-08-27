import { Portal } from "solid-js/web";
import { Show, createSignal, onCleanup, onMount, type Component } from "solid-js";
import type { DropdownAnchor } from "../../types.js";
import { nativeCancelAnimationFrame, nativeRequestAnimationFrame } from "../../utils/native-raf.js";
import { REACT_GRAB_ATTRIBUTE_NAME } from "../../utils/react-grab-attribute-name.js";
import { ToolbarActionButton } from "../../components/toolbar/toolbar-action-button.js";
import { CommentHistoryDropdown } from "./comment-history-dropdown.js";
import { loadCommentHistory, subscribeToCommentHistory } from "./comment-history-store.js";
import { IconCommentHistory } from "./icon-comment-history.js";
import { COMMENT_HISTORY_ICON_SIZE_PX } from "./constants.js";
import type { CommentHistoryItem } from "./types.js";

interface CommentHistoryToolbarProps {
  edge: "top" | "bottom" | "left" | "right";
  buttonClass: string;
  wrapperClass: string;
  iconClass: string;
  tooltipPosition: "top" | "bottom" | "left" | "right";
  createDragAwareHandler: (handler: () => void) => (event: MouseEvent) => void;
  onMouseEnter: (event: MouseEvent) => void;
  onMouseLeave: () => void;
}

export const CommentHistoryToolbar: Component<CommentHistoryToolbarProps> = (props) => {
  let buttonElement: HTMLButtonElement | undefined;
  let positionFrameId: number | null = null;
  const [items, setItems] = createSignal<CommentHistoryItem[]>(loadCommentHistory());
  const [isOpen, setIsOpen] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [position, setPosition] = createSignal<DropdownAnchor | null>(null);
  const [portalMount, setPortalMount] = createSignal<HTMLElement | undefined>();

  const updatePortalMount = () => {
    const rootNode = buttonElement?.getRootNode();
    setPortalMount(
      rootNode instanceof ShadowRoot
        ? (rootNode.querySelector<HTMLElement>(`[${REACT_GRAB_ATTRIBUTE_NAME}]`) ?? undefined)
        : undefined,
    );
  };

  const updatePosition = () => {
    if (!buttonElement || !isOpen()) return;
    const buttonBounds = buttonElement.getBoundingClientRect();
    const edge = props.edge;
    const nextPosition: DropdownAnchor = {
      x:
        edge === "left"
          ? buttonBounds.right
          : edge === "right"
            ? buttonBounds.left
            : buttonBounds.left + buttonBounds.width / 2,
      y:
        edge === "top"
          ? buttonBounds.bottom
          : edge === "bottom"
            ? buttonBounds.top
            : buttonBounds.top + buttonBounds.height / 2,
      edge,
    };
    setPosition((currentPosition) =>
      currentPosition?.x === nextPosition.x &&
      currentPosition.y === nextPosition.y &&
      currentPosition.edge === nextPosition.edge
        ? currentPosition
        : nextPosition,
    );
    positionFrameId = nativeRequestAnimationFrame(updatePosition);
  };

  const stopPositionTracking = () => {
    if (positionFrameId === null) return;
    nativeCancelAnimationFrame(positionFrameId);
    positionFrameId = null;
  };

  const closeDropdown = () => {
    stopPositionTracking();
    setPosition(null);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (isOpen()) {
      closeDropdown();
      return;
    }
    setIsOpen(true);
    updatePosition();
  };

  const handleToggle = props.createDragAwareHandler(toggleDropdown);

  onMount(() => {
    updatePortalMount();
    const unsubscribe = subscribeToCommentHistory((nextItems) => {
      setItems([...nextItems]);
      if (nextItems.length === 0) closeDropdown();
    });
    onCleanup(() => {
      unsubscribe();
      stopPositionTracking();
    });
  });

  return (
    <Show when={items().length > 0}>
      <ToolbarActionButton
        actionId="comment-history"
        ref={(element) => {
          buttonElement = element;
          queueMicrotask(updatePortalMount);
        }}
        label={`Open comments (${items().length})`}
        class={props.buttonClass}
        wrapperClass={props.wrapperClass}
        onClick={handleToggle}
        onMouseEnter={(event) => {
          setIsHovered(true);
          props.onMouseEnter(event);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          props.onMouseLeave();
        }}
        icon={<IconCommentHistory size={COMMENT_HISTORY_ICON_SIZE_PX} class={props.iconClass} />}
        tooltip="Comments"
        tooltipVisible={isHovered() && !isOpen()}
        tooltipPosition={props.tooltipPosition}
      />
      <Show when={portalMount()}>
        {(mount) => (
          <Portal mount={mount()}>
            <CommentHistoryDropdown
              position={position()}
              items={items()}
              onDismiss={closeDropdown}
            />
          </Portal>
        )}
      </Show>
    </Show>
  );
};
