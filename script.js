document.addEventListener("DOMContentLoaded", () => {
    const renameBtn = document.getElementById("renameBtn");
    const stopBtn = document.getElementById("stopBtn");

    renameBtn.addEventListener("click", shrinkPanelForPlayback);
    stopBtn.addEventListener("click", restorePanel);
});

function shrinkPanelForPlayback() {
    // Hide main controls, show playback controls
    document.getElementById("controls").style.display = "none";
    document.getElementById("playbackControls").style.display = "flex";

    // Resize the outer Photopea panel (.body element)
    const panelBody = window.frameElement.closest(".body");
    if (panelBody) {
        panelBody.style.width = "80px"; // adjust as needed
    }
}

function restorePanel() {
    // Restore controls
    document.getElementById("controls").style.display = "flex";
    document.getElementById("playbackControls").style.display = "none";

    // Reset panel width
    const panelBody = window.frameElement.closest(".body");
    if (panelBody) {
        panelBody.style.width = "";
    }
}
