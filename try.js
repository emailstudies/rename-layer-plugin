// Playback control variables
let shouldStop = false;
let currentTimerId = null;

// Clear running timer
function clearTimer() {
  if (currentTimerId) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }
}

// Get visible folders (layer sets)
function getVisibleFolders() {
  const doc = app.activeDocument;
  let folders = [];
  for (let i = 0; i < doc.layers.length; i++) {
    const layer = doc.layers[i];
    if (layer.typename === "LayerSet" && layer.visible) {
      folders.push(layer);
    }
  }
  return folders;
}

// Get max frame count across folders
function getMaxFrameCount(folders) {
  if (folders.length === 0) return 0;
  let counts = folders.map(f => f.layers.length);
  return Math.max(...counts);
}

// Show only one frame in a folder (reverse indexing)
function showOnlyFrameInFolder(folder, globalFrameIndex, maxFrameCount) {
  const totalFrames = folder.layers.length;
  let frameIndex = totalFrames - 1 - (maxFrameCount - 1 - globalFrameIndex);
  for (let i = 0; i < totalFrames; i++) {
    folder.layers[i].visible = (i === frameIndex);
  }
}

// Playback loop for all folders
function playAllFolders(delayMs) {
  const folders = getVisibleFolders();
  if (folders.length === 0) {
    alert("No visible folders found to play.");
    return;
  }

  const maxCount = getMaxFrameCount(folders);
  let globalFrameIndex = maxCount - 1;
  shouldStop = false;
  clearTimer();

  function nextFrame() {
    if (shouldStop) {
      clearTimer();
      return;
    }

    folders.forEach(folder => {
      showOnlyFrameInFolder(folder, globalFrameIndex, maxCount);
    });

    globalFrameIndex--;
    if (globalFrameIndex < 0) globalFrameIndex = maxCount - 1;

    currentTimerId = setTimeout(nextFrame, delayMs);
  }

  nextFrame();
}

function stopPlayback() {
  shouldStop = true;
  clearTimer();
}

// Hook buttons to playback functions
document.getElementById("renameBtn").onclick = () => {
  // Get delay from manualDelay input or fpsSelect dropdown
  let manualDelay = parseFloat(document.getElementById("manualDelay").value);
  let delay;
  if (!isNaN(manualDelay) && manualDelay > 0) {
    delay = manualDelay * 1000;
  } else {
    let fps = parseInt(document.getElementById("fpsSelect").value, 10);
    delay = 1000 / (fps || 12);
  }
  playAllFolders(delay);
};

document.getElementById("stopBtn").onclick = () => {
  stopPlayback();
};
