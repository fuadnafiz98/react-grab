import { expect, test } from "./fixtures.js";
import type { ReactGrabPageObject } from "./fixtures.js";

const addComment = async (
  reactGrab: ReactGrabPageObject,
  selector: string,
  commentText: string,
): Promise<void> => {
  await reactGrab.enterPromptMode(selector);
  await reactGrab.typeInInput(commentText);
  await reactGrab.submitInput();
  await expect.poll(() => reactGrab.getClipboardContent()).toContain(commentText);
};

const openCommentHistory = async (reactGrab: ReactGrabPageObject): Promise<void> => {
  const historyButton = reactGrab.page.locator(
    "[data-react-grab-toolbar-action='comment-history']",
  );
  await expect(historyButton).toBeVisible();
  await historyButton.click();
  await expect(reactGrab.page.locator("[data-react-grab-comment-history]")).toBeVisible();
};

test.describe("Comment history", () => {
  test("restores comments and copies all saved context", async ({ reactGrab }) => {
    await addComment(reactGrab, "li:first-child", "Make the first item bold");
    await addComment(reactGrab, "li:last-child", "Move the last item up");

    await reactGrab.page.evaluate(() => navigator.clipboard.writeText(""));
    await openCommentHistory(reactGrab);

    const commentItems = reactGrab.page.locator(
      "[data-react-grab-comment-history] [data-react-grab-comment-history-item]",
    );
    await expect(commentItems).toHaveCount(2);

    await reactGrab.page.locator("[data-react-grab-comment-history-copy-all]").click();

    const clipboardContent = await reactGrab.getClipboardContent();
    expect(clipboardContent).toContain("[1]");
    expect(clipboardContent).toContain("[2]");
    expect(clipboardContent).toContain("Make the first item bold");
    expect(clipboardContent).toContain("Move the last item up");
  });

  test("deduplicates repeated comments and supports remove and clear", async ({ reactGrab }) => {
    await addComment(reactGrab, "li:first-child", "Use the accent color");
    await addComment(reactGrab, "li:first-child", "Use the accent color");
    await addComment(reactGrab, "li:last-child", "Add more spacing");
    await openCommentHistory(reactGrab);

    const commentItems = reactGrab.page.locator(
      "[data-react-grab-comment-history] [data-react-grab-comment-history-item]",
    );
    await expect(commentItems).toHaveCount(2);

    await commentItems.first().locator("[data-react-grab-comment-history-remove]").click();
    await expect(commentItems).toHaveCount(1);

    await reactGrab.page.locator("[data-react-grab-comment-history-clear]").click();
    await expect(
      reactGrab.page.locator("[data-react-grab-toolbar-action='comment-history']"),
    ).toHaveCount(0);
  });

  test("restores saved comments after a page reload", async ({ reactGrab }) => {
    await addComment(reactGrab, "li:first-child", "Keep this after reload");

    await reactGrab.page.reload();
    await expect
      .poll(() => reactGrab.page.evaluate(() => Boolean(window.__REACT_GRAB__)))
      .toBe(true);
    await openCommentHistory(reactGrab);

    await expect(
      reactGrab.page.locator(
        "[data-react-grab-comment-history] [data-react-grab-comment-history-item]",
      ),
    ).toHaveCount(1);
    await expect(reactGrab.page.locator("[data-react-grab-comment-history]")).toContainText(
      "Keep this after reload",
    );
  });
});
