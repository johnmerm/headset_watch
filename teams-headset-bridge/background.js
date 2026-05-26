// Native messaging connection link
const port = chrome.runtime.connectNative('com.giannis.dbus_bridge');

// Helper function to dynamically draw a solid color extension icon
function setIconColor(color) {
  // Creating a 16x16 canvas element context dynamically
  const canvas = new OffscreenCanvas(16, 16);
  const context = canvas.getContext('2d');

  // Draw a smooth rounded rectangle for the extension icon
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(0, 0, 16, 16, 3);
  context.fill();

  const imageData = context.getImageData(0, 0, 16, 16);
  chrome.action.setIcon({ imageData: imageData });
}

// Function to scan tabs and update the icon color based on presence of Teams
function checkTeamsTabs() {
  chrome.tabs.query({ url: "*://teams.cloud.microsoft/*" }, (tabs) => {
    if (tabs.length > 0) {
      setIconColor("#0078d4"); // Microsoft Blue
    } else {
      setIconColor("#7f7f7f"); // Neutral Grey (Inactive)
    }
  });
}

// Function to trigger a rhythmic blinking badge effect on hardware signal receipt
function triggerBlinkBadge() {
  let blinks = 0;
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // Solid Red

  const intervalId = setInterval(() => {
    if (blinks >= 6) { // Blinks red 3 times (on/off loop equals 6 steps)
      clearInterval(intervalId);
      chrome.action.setBadgeText({ text: "" }); // Clear badge text
      return;
    }

    if (blinks % 2 === 0) {
      chrome.action.setBadgeText({ text: "MUTE" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
    blinks++;
  }, 250); // Blink state swap speed (in milliseconds)
}

// 1. Monitor Tab updates to change icon color proactively
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') checkTeamsTabs();
});
chrome.tabs.onRemoved.addListener(() => checkTeamsTabs());

// Set initial icon color on script startup spin-up
checkTeamsTabs();

// Processing Incoming Hardware Messages from D-Bus Pipe
port.onMessage.addListener((msg) => {
  if (msg.event === "hangup") {
    triggerBlinkBadge();

    // Find all potential Teams tabs (focused or unfocused)
    chrome.tabs.query({ url: ["*://teams.cloud.microsoft/*", "*://teams.microsoft.com/*"] }, (tabs) => {
      if (tabs.length === 0) {
        console.log("JBL Bridge: No Teams tabs open anywhere.");
        return;
      }

      // Prioritize an active call tab if we've hooked a button,
      // otherwise fallback to the first available Teams tab.
      tabs.forEach((tab) => {
        // Safe messaging: catch the error if the tab isn't ready/listening
        chrome.tabs.sendMessage(tab.id, { action: "toggle_mute" }).catch((err) => {
          // Quietly log and ignore tabs that aren't fully loaded yet
          console.log(`JBL Bridge: Tab ${tab.id} wasn't ready to receive events. Ignoring.`);
        });
      });
    });
  }
});
port.onDisconnect.addListener(() => {
  console.error("Native messaging channel dropped.");
  setIconColor("#d13438"); // Turn icon error-red if native execution breaks
});