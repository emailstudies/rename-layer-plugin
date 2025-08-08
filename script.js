// panel_resize.js

document.addEventListener("DOMContentLoaded", () => {
    const resizeBtn = document.getElementById("renameBtn");

    if (!resizeBtn) {
        console.warn("⚠️ No button with ID 'resizeBtn' found.");
        return;
    }

    resizeBtn.addEventListener("click", () => {
        // Check if we're inside an iframe
        if (window.frameElement) {
            try {
                // Set new size for plugin panel iframe
                window.frameElement.style.width = "200px";   // or any width you want
                window.frameElement.style.height = "40px";   // collapsed height
                console.log("✅ Panel resized inside Photopea iframe.");
            } catch (err) {
                console.error("❌ Could not resize iframe:", err);
            }
        } else {
            console.warn("Not inside an iframe — can't resize panel here.");
        }
    });
});
