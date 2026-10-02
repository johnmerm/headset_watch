const gainInput = document.getElementById('gain');
const gainVal = document.getElementById('gain-val');
const durationInput = document.getElementById('duration');
const durationVal = document.getElementById('duration-val');
const testBtn = document.getElementById('test-btn');

// Load stored values or defaults on display
chrome.storage.local.get({ cueGain: 0.15, cueDuration: 0.2 }, (items) => {
  gainInput.value = items.cueGain;
  gainVal.textContent = Math.round(items.cueGain * 100) + '%';
  durationInput.value = items.cueDuration;
  durationVal.textContent = items.cueDuration + 's';
});

// Sync real-time sliders to local state profiles
gainInput.addEventListener('input', () => {
  gainVal.textContent = Math.round(gainInput.value * 100) + '%';
  chrome.storage.local.set({ cueGain: parseFloat(gainInput.value) });
});

durationInput.addEventListener('input', () => {
  durationVal.textContent = durationInput.value + 's';
  chrome.storage.local.set({ cueDuration: parseFloat(durationInput.value) });
});

// Add a test buzzer inside the configuration window to gauge profile accuracy
testBtn.addEventListener('click', () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(parseFloat(gainInput.value), audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + parseFloat(durationInput.value));

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + parseFloat(durationInput.value));
});