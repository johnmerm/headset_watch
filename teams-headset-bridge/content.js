let buttonFound = false;
console.log("Inside content.js")
function lookForMuteButton() {
  // Check common Microsoft Teams web client button signatures
  const muteBtn = document.querySelector('button[data-inp="microphone-button"]')
      || document.querySelector('button#mic-button');

  if (muteBtn && !buttonFound) {
    buttonFound = true;
    console.log("JBL Bridge: Teams mute button verified in DOM layout.");
    // Report finding back to the background controller
    chrome.runtime.sendMessage({ status: "button_hooked" });
  } else if (!muteBtn && buttonFound) {
    // If the user leaves a call or the element unmounts
    buttonFound = false;
    chrome.runtime.sendMessage({ status: "button_lost" });
  }
}

// Watch the DOM dynamically for updates as Teams initializes frames
const observer = new MutationObserver(() => lookForMuteButton());
observer.observe(document.body, { childList: true, subtree: true });

// Physical double-tap command execution (works flawlessly on background tabs)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Inside content listener");
  if (request.action === "toggle_mute") {
    console.log("Inside toggle_mute button");
    // Broaden our search query to find the button regardless of view state
    const muteBtn = document.querySelector('button[data-inp="microphone-button"]')
      || document.querySelector('button#mic-button');


    if (muteBtn) {
      // Determine the current state BEFORE clicking to play the right audio chime
      // Most modern Teams web clients track state using aria-label (e.g., "Mute microphone")
      const ariaLabel = muteBtn.getAttribute('aria-label') || '';
      const currentlyMuted = ariaLabel.toLowerCase().includes('unmute');

      muteBtn.click();
      console.log("JBL Bridge: Successfully clicked the microphone button in the background!");

      // Play the responsive indicator sound
      // If currentlyMuted was true, clicking it will UNMUTE it (hence !currentlyMuted)
      playAudioCue(!currentlyMuted);

      sendResponse({ success: true });
    } else {
      console.warn("JBL Bridge: Target mute button hidden or unmounted.");
      sendResponse({ success: false });
    }
  }
  return true; // Keeps the messaging channel open for asynchronous responses
});

// Helper function to synthesize a clean, native audio beep
// State 1: High-to-Low chime for Mute. State 2: Low-to-High chime for Unmute.
function playAudioCue(isMuted) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Create two quick successive notes for a modern interface chime
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'sine'; // Clean electronic tone

  // Frequency logic: Mute = high then drops. Unmute = low then rises.
  const now = audioCtx.currentTime;

  const highValue = 600;
  const lowValue = 300;
  const time = 0.15;
  const volume = 0.45;


  if (isMuted) {
    osc.frequency.setValueAtTime(highValue, now);       // Start high (600Hz)
    osc.frequency.exponentialRampToValueAtTime(lowValue, now + time); // Drop low (300Hz)
  } else {
    osc.frequency.setValueAtTime(lowValue, now);       // Start low (300Hz)
    osc.frequency.exponentialRampToValueAtTime(highValue, now + time); // Rise high (600Hz)
  }

  // Smoothly fade out the volume so it doesn't pop or click roughly
  gainNode.gain.setValueAtTime(volume, now); // Set comfortable volume (15%)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Fade to 0

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.2); // Total chime duration: 200ms
}
