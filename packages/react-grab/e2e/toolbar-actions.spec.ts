import { test, expect, type ReactGrabPageObject } from "./fixtures.js";

const BUTTON_SELECTOR = "button";

const waitForToolbar = async (reactGrab: ReactGrabPageObject) => {
  await expect.poll(() => reactGrab.isToolbarVisible(), { timeout: 2000 }).toBe(true);
};

test.describe("Toolbar Action Buttons", () => {
  test.describe("Layout", () => {
    test("renders separate Copy and Comment buttons, unpressed initially", async ({
      reactGrab,
    }) => {
      await waitForToolbar(reactGrab);

      const actionIds = await reactGrab.page
        .locator("[data-react-grab-toolbar-action]")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("data-react-grab-toolbar-action")),
        );
      expect(actionIds).toEqual(["copy", "comment"]);
      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(false);
      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(false);
    });

    test("opens the comment box after selecting an element with Comment", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);

      await expect(
        reactGrab.page.locator('[data-react-grab-toolbar-action="comment"]'),
      ).toHaveAttribute("aria-label", "Comment on element");

      await reactGrab.clickToolbarAction("comment");

      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(true);
      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(false);
      await reactGrab.hoverUntilSelected(BUTTON_SELECTOR);
      await reactGrab.clickElement(BUTTON_SELECTOR);
      await expect.poll(() => reactGrab.isPromptModeActive(), { timeout: 2000 }).toBe(true);
    });

    test("keeps Comment active after submitting so another element can be commented", async ({
      reactGrab,
    }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.clickToolbarAction("comment");
      await reactGrab.hoverUntilSelected("button");
      await reactGrab.clickElement("button");
      await reactGrab.typeInInput("First comment");
      await reactGrab.submitInput();

      await expect.poll(() => reactGrab.isPromptModeActive()).toBe(false);
      await expect.poll(() => reactGrab.getToolbarActionPressed("comment")).toBe(true);

      await reactGrab.hoverUntilTargetSelected("h1");
      await expect.poll(async () => (await reactGrab.getSelectionLabelInfo()).tagName).toBe("h1");
      await reactGrab.clickElement("h1");
      await expect.poll(() => reactGrab.isPromptModeActive()).toBe(true);
      await reactGrab.typeInInput("Second comment");
      await reactGrab.submitInput();

      await expect.poll(() => reactGrab.isPromptModeActive()).toBe(false);
      await expect(reactGrab.page.locator("[data-react-grab-comment-history-badge]")).toHaveText(
        "2",
      );
    });

    test("stops persistent Comment mode with Escape", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.clickToolbarAction("comment");
      await reactGrab.hoverUntilSelected("button");
      await reactGrab.clickElement("button");
      await reactGrab.typeInInput("Stop after this comment");
      await reactGrab.submitInput();

      await expect.poll(() => reactGrab.getToolbarActionPressed("comment")).toBe(true);
      await reactGrab.deactivate();
      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(false);
    });
  });

  test.describe("Active-state attribution", () => {
    test("clicking Copy marks it as pressed", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.clickToolbarAction("copy");

      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(true);
    });

    test("activating via API (no toolbar button) marks Copy as pressed", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.activate();

      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(true);
    });

    test("switches from API activation to the selected Comment default", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.page.evaluate(() => {
        window.__REACT_GRAB__?.setToolbarState({ defaultAction: "comment" });
      });
      await reactGrab.activate();

      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(false);
      await reactGrab.clickToolbarAction("comment");
      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(true);

      await reactGrab.hoverUntilSelected(BUTTON_SELECTOR);
      await reactGrab.clickElement(BUTTON_SELECTOR);
      await expect.poll(() => reactGrab.isPromptModeActive(), { timeout: 2000 }).toBe(true);
    });

    test("updates the armed action when the default changes", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.clickToolbarAction("copy");
      await reactGrab.rightClickToolbarToggle();
      await reactGrab.clickToolbarMenuItem("comment");

      expect(await reactGrab.getToolbarActionPressed("comment")).toBe(true);
      await reactGrab.hoverUntilSelected(BUTTON_SELECTOR);
      await reactGrab.clickElement(BUTTON_SELECTOR);
      await expect.poll(() => reactGrab.isPromptModeActive(), { timeout: 2000 }).toBe(true);
    });

    test("Escape resets the Copy button to unpressed", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.clickToolbarAction("copy");
      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(true);

      await reactGrab.deactivate();

      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(false);
    });

    test("context menu Comment leaves the Copy button unpressed", async ({ reactGrab }) => {
      await waitForToolbar(reactGrab);
      await reactGrab.activate();
      await reactGrab.hoverUntilSelected(BUTTON_SELECTOR);
      await reactGrab.rightClickElement(BUTTON_SELECTOR);
      await reactGrab.clickContextMenuItem("Comment");

      await expect.poll(() => reactGrab.isPromptModeActive(), { timeout: 2000 }).toBe(true);
      expect(await reactGrab.getToolbarActionPressed("copy")).toBe(false);
    });
  });
});
