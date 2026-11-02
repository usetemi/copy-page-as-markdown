const BADGE_DURATION_MS = 2000;

// Only one offscreen document can exist, so a repeat press waits out the copy in progress.
let copying = false;

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  if (tabId === undefined || copying) return;
  copying = true;
  try {
    await writeToClipboard(await convertTab(tabId));
    await showBadge(tabId, "✓", "#0c8159");
  } catch (error) {
    console.error("Copy failed", error);
    await showBadge(tabId, "✕", "#d3395c");
  } finally {
    copying = false;
  }
});

async function convertTab(tabId: number): Promise<string> {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.pageToMarkdown(document),
  });
  if (!injection?.result) throw new Error("The page returned no Markdown");
  return injection.result;
}

// An offscreen document can write to the clipboard whatever the page's focus,
// security context, or permissions policy.
async function writeToClipboard(text: string): Promise<void> {
  // A document can outlive a service worker that stopped mid-copy.
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Write the converted Markdown to the clipboard.",
    });
  }
  try {
    const copied: boolean = await chrome.runtime.sendMessage(text);
    if (!copied) throw new Error("The clipboard write failed");
  } finally {
    await chrome.offscreen.closeDocument();
  }
}

async function showBadge(tabId: number, text: string, color: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), BADGE_DURATION_MS);
}
