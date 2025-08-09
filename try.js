const Playback = (() => {
  let currentTimerId = null;
  let shouldStop = false;

  // Get visible folders (layer sets)
  function getVisibleFolders() {
    let count = app.activeDocument.layers.length;
    let folders = [];
    for (let i = 0; i < count; i++) {
      let lyr = app.activeDocument.layers[i];
      if (lyr.layers && lyr.visible) folders.push(lyr);
    }
    return folders;
  }

  // Get max frame count across all folders
  function getMaxFrameCount(folders) {
    return Math.max(...folders.map(f => f.layers.length));
  }

  // Show only one frame in a folder (0-based index, top layer = 0)
  function showOnlyFrameInFolder(folder, frameIndex) {
    let total = folder.layers.length;
    for (let i = 0; i < total; i++) {
      folder.layers[i].visible = (i === frameIndex);
    }
  }

  // Clear running timer
  function clearTimer() {
    if (currentTimerId) {
      clearTimeout(currentTimerId);
      currentTimerId = null;
    }
  }

  // Main playback loop
  function playAllFolders(delay) {
    let folders = getVisibleFolders();
    if (folders.length === 0) {
      console.log("⚠️ No visible folders to play.");
      return;
    }

    let maxCount = getMaxFrameCount(folders);
    console.log(`🎬 Starting playback. Max frames = ${maxCount}`);

    let frameIndex = maxCount - 1; // Start from top layer index
    shouldStop = false;
    clearTimer();

    function next() {
      if (shouldStop) {
        console.log("🛑 Playback stopped.");
        clearTimer();
        return;
      }

      folders.forEach(folder => {
        let total = folder.layers.length;
        // Calculate folder-specific frame index from global frame index
        let indexForThisFolder = total - 1 - (maxCount - 1 - frameIndex);

        if (indexForThisFolder >= 0 && indexForThisFolder < total) {
          showOnlyFrameInFolder(folder, indexForThisFolder);
        } else {
          // Hide all if no frame for this step
          for (let i = 0; i < total; i++) {
            folder.layers[i].visible = false;
          }
        }
      });

      console.log(`▶️ Global frame: ${frameIndex + 1} (Layer index ${frameIndex})`);

      frameIndex--;
      if (frameIndex < 0) {
        frameIndex = maxCount - 1;
      }

      currentTimerId = setTimeout(next, delay);
    }

    next();
  }

  // Public API
  return {
    startPlayback() {
      // Read delay from manual input or fps select
      const manualDelayVal = parseFloat(document.getElementById("manualDelay").value);
      let delay;
      if (!isNaN(manualDelayVal) && manualDelayVal > 0) {
        delay = manualDelayVal * 1000;
      } else {
        const fps = parseInt(document.getElementById("fpsSelect").value, 10);
        delay = 1000 / (fps || 12);
      }

      playAllFolders(delay);
    },

    stopPlayback() {
      shouldStop = true;
      clearTimer();
    }
  };
})();

// Hook up buttons using your style
document.getElementById("renameBtn").onclick = () => Playback.startPlayback();
document.getElementById("stopBtn").onclick = () => Playback.stopPlayback();
