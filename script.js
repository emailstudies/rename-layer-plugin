// script.js
document.addEventListener("DOMContentLoaded", () => {
    const renameBtn = document.getElementById("renameBtn");
    const stopBtn = document.getElementById("stopBtn");

    renameBtn.addEventListener("click", () => {
        shrinkPanelForPlayback();
    });

    stopBtn.addEventListener("click", () => {
        restorePanel();
    });
});

function shrinkPanelForPlayback() {
    // Hide full controls, show playback controls
    document.getElementById("controls").style.display = "none";
    document.getElementById("playbackControls").style.display = "flex";

    // Get the outer panel container (Photopea wraps iframe in a .body div)
    const panelBody = window.frameElement.parentElement;
    if (panelBody) {
        panelBody.style.width = "60px";   // narrow width for two buttons
        panelBody.style.height = "30px";  // just enough height for buttons
    }
}

function restorePanel() {
    // Show full controls, hide playback controls
    document.getElementById("controls").style.display = "flex";
    document.getElementById("playbackControls").style.display = "none";

    // Reset the panel container size so Photopea auto-sizes again
    const panelBody = window.frameElement.parentElement;
    if (panelBody) {
        panelBody.style.width = "";
        panelBody.style.height = "";
    }
}
