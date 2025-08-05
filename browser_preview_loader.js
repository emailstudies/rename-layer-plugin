document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  const collectedFrames = [];
  let previewTab = null;

  if (!btn) {
    console.error("❌ Button not found: #webPreviewSelectedBtn");
    return;
  }

  btn.onclick = () => {
    collectedFrames.length = 0;
    previewTab = window.open("preview.html", "_blank");

    if (!previewTab) {
      alert("❌ Failed to open preview window. Please allow popups.");
      return;
    }

    console.log("⏳ Opening preview tab...");

    // Give time for preview.html to load before triggering Photopea export
    setTimeout(() => {
      parent.postMessage("EXPORT_SELECTED_ANIM_FRAMES", "*");
      console.log("▶️ Started frame export");
    }, 300);
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log(`🧩 Frame ${collectedFrames.length} received`);
    } else if (typeof event.data === "string") {
      console.log("📩 Message from Photopea:", event.data);

      if (event.data.startsWith("✅")) {
        if (!collectedFrames.length) {
          alert("❌ No frames received");
          return;
        }

        // Send to preview window after confirming Photopea export is done
        setTimeout(() => {
          if (previewTab) {
            previewTab.postMessage(collectedFrames, "*");
            console.log("📨 Sent all frames to preview tab");
          } else {
            alert("❌ Preview tab was closed before frames could be sent.");
          }
        }, 500);
      } else if (event.data.startsWith("❌")) {
        alert(event.data);
      }
    }
  });
});
