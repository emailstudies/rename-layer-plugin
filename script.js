// script.js

let compact = false; // track toggle state

document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - requesting panel resize");

  if (window.frameElement) {
    // We are in an iframe inside Photopea
    if (!compact) {
      // Switch to compact mode
      window.frameElement.style.height = "20px";
      console.log("Panel resized to compact mode (20px)");
    } else {
      // Switch back to full height
      window.frameElement.style.height = "auto";
      console.log("Panel resized to full mode (auto)");
    }
    compact = !compact;
  } else {
    console.warn("Not inside a Photopea iframe — cannot resize");
  }
});
