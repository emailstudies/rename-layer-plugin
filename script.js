// resize_panel.js
document.addEventListener("DOMContentLoaded", function () {
    const resizeBtn = document.getElementById("resizeBtn");

    if (!resizeBtn) {
        console.error("Button #resizeBtn not found");
        return;
    }

    resizeBtn.addEventListener("click", function () {
        if (!window.frameElement) {
            console.warn("Not inside an iframe — can't resize.");
            return;
        }

        // Example: Shrink to 150x40
        window.frameElement.style.width = "150px";
        window.frameElement.style.height = "40px";

        console.log("📏 Panel resized to 150x40");
    });
});
