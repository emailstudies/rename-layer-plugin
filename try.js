// ===== SETTINGS =====
let currentTimerId = null;
let shouldStop = false;

// Utility: stop any running playback
function clearTimer() {
    if (currentTimerId) {
        clearTimeout(currentTimerId);
        currentTimerId = null;
    }
}

// Utility: get all visible folders in the current document
function getVisibleFolders() {
    let count = app.activeDocument.layers.length;
    let folders = [];
    for (let i = 0; i < count; i++) {
        let lyr = app.activeDocument.layers[i];
        if (lyr.layers && lyr.visible) folders.push(lyr);
    }
    return folders;
}

// Utility: get the max frame count across visible folders
function getMaxFrameCount(folders) {
    return Math.max(...folders.map(f => f.layers.length));
}

// Utility: show only one frame in a folder (index is zero-based, top layer = 0)
function showOnlyFrameInFolder(folder, frameIndex) {
    let total = folder.layers.length;
    for (let i = 0; i < total; i++) {
        folder.layers[i].visible = (i === frameIndex);
    }
}

// Main multi-folder playback
function playAllFolders(delay) {
    let folders = getVisibleFolders();
    if (folders.length === 0) {
        console.log("⚠️ No visible folders to play.");
        return;
    }

    let maxCount = getMaxFrameCount(folders);
    console.log(`🎬 Starting playback. Max frames = ${maxCount}`);

    // Start from Layer 1 (index = n - 1 for each folder)
    let frameIndex = maxCount - 1;

    shouldStop = false;
    clearTimer();

    function next() {
        if (shouldStop) {
            console.log("🛑 Playback stopped.");
            clearTimer();
            return;
        }

        // For each folder, show correct frame or hide if frame doesn't exist
        folders.forEach(folder => {
            let total = folder.layers.length;
            let indexForThisFolder = total - 1 - (maxCount - 1 - frameIndex);

            if (indexForThisFolder >= 0 && indexForThisFolder < total) {
                showOnlyFrameInFolder(folder, indexForThisFolder);
            } else {
                // Hide all layers if this folder has no frame for this step
                for (let i = 0; i < total; i++) {
                    folder.layers[i].visible = false;
                }
            }
        });

        console.log(`▶️ Global frame: ${frameIndex + 1} (Layer index ${frameIndex})`);

        // Step down toward index 0
        frameIndex--;

        // If we reached below 0, loop back to n - 1 for all
        if (frameIndex < 0) {
            frameIndex = maxCount - 1;
        }

        currentTimerId = setTimeout(next, delay);
    }

    next();
}

// Stop playback
function stopPlayback() {
    shouldStop = true;
    clearTimer();
}

// ===== HOOK UP BUTTONS =====
document.getElementById("playBtn").onclick = function () {
    playAllFolders(200); // Example: 200ms delay
};

document.getElementById("stopBtn").onclick = function () {
    stopPlayback();
};
