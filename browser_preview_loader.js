document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  const collectedFrames = [];
  let previewTab = null;
  let readyToOpenTab = false;

  if (!btn) {
    console.error("❌ Button not found: webPreviewSelectedBtn");
    return;
  }

  btn.onclick = () => {
    collectedFrames.length = 0;
    readyToOpenTab = true;

    parent.postMessage("EXPORT_SELECTED_ANIM_FRAMES", "*");
    console.log("▶️ Started frame export");
  };

  window.addEventListener("message", (event) => {
    // Ignore irrelevant junk
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log("🧩 Frame received:", collectedFrames.length);
      return;
    }

    if (typeof event.data !== "string") return;
    if (!event.data.startsWith("[plugin]")) return;

    const message = event.data.replace("[plugin] ", "");
    console.log("📩 Plugin message:", message);

    if (message.startsWith("✅")) {
      if (!collectedFrames.length) {
        alert("❌ No frames received");
        return;
      }

      if (readyToOpenTab && !previewTab) {
        previewTab = window.open("preview.html", "_blank");
      }

      setTimeout(() => {
        previewTab?.postMessage(collectedFrames, "*");
        console.log("📨 Sent frames to preview tab");
      }, 300);

    } else if (message.startsWith("❌")) {
      alert(message);
    }
  });
});

