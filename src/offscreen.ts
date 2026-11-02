chrome.runtime.onMessage.addListener((text: string, _sender, sendResponse) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.append(textarea);
  textarea.select();
  sendResponse(document.execCommand("copy"));
  textarea.remove();
});
