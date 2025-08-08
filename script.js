// script.js

// Attach event listeners after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const renameBtn = document.getElementById("renameBtn");
    const stopBtn = document.getElementById("stopBtn");

    renameBtn.addEventListener("click", () => {
        // Simulate starting playback — shrink panel
        shrinkPanelForPlayback();
    });

    stopBtn.addEventListener("click", () => {
        // Restore panel size and UI
        restorePanel();
    });
});

function shrinkPanelForPlayback() {
    // Hide full controls, show playback controls
    document.getElementById("controls").style.display = "none";
    document.getElementById("playbackControls").style.display = "flex";

    // Shrink iframe size to fit playback controls
    // (Hardcoded minimal size for now)
    window.frameElement.style.width = "60px";
    window.frameElement.style.height = "30px";
}

function restorePanel() {
    // Show full controls, hide playback controls
    document.getElementById("controls").style.display = "flex";
    document.getElementById("playbackControls").style.display = "none";

    // Clear inline sizing so Photopea auto-sizes again
    window.frameElement.style.width = "";
    window.frameElement.style.height = "";
}
