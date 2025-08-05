document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  const collectedFrames = [];
  let previewTab = null;

  if (!btn) {
    console.error("❌ Button not found: renameBtn");
    return;
  }

  btn.onclick = () => {
    collectedFrames.length = 0;
    previewTab = window.open("preview.html", "_blank");

    setTimeout(() => {
      parent.postMessage("EXPORT_SELECTED_ANIM_FRAMES", "*");
      console.log("▶️ Started frame export");
    }, 300);
  };

  window.addEventListener("message", (event) => {
    // Filter out ad/analytics noise
    if (!(event.data instanceof ArrayBuffer) && typeof event.data !== "string") return;

    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log("🧩 Frame received:", collectedFrames.length);
    } else if (typeof event.data === "string") {
      // Only log relevant plugin-related strings
      if (!event.data.startsWith("✅") && !event.data.startsWith("❌")) return;

      console.log("📩 Message from Photopea:", event.data);

      if (event.data.startsWith("✅")) {
        if (!collectedFrames.length) {
          alert("❌ No frames received");
          return;
        }

        // Send frames to preview.html
        setTimeout(() => {
          previewTab?.postMessage(collectedFrames, "*");
          console.log("📨 Sent frames to preview tab");
        }, 500);
      } else if (event.data.startsWith("❌")) {
        alert(event.data);
      }
    }
  });
});
