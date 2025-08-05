document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn"); // This is your trigger
  const collectedFrames = [];
  let previewTab = null;
  let readyToOpenTab = false;

  if (!btn) {
    console.error("❌ Button not found: renameBtn");
    return;
  }

  btn.onclick = () => {
    collectedFrames.length = 0;
    readyToOpenTab = true;
    previewTab = null;

    // 🔁 Send export request to Photopea iframe
    const photopea = document.getElementById("photopea-iframe")?.contentWindow;
    if (photopea) {
      photopea.postMessage("EXPORT_SELECTED_ANIM_FRAMES", "*");
      console.log("▶️ Started frame export");
    } else {
      alert("❌ Photopea iframe not found");
    }
  };

  window.addEventListener("message", (event) => {
    // 🎯 Only accept messages from Photopea iframe
    if (event.origin && !event.origin.includes("photopea.com")) return;

    // 🧩 Receive image data
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
      console.log("🧩 Frame received:", collectedFrames.length);
      return;
    }

    // 📩 Receive string message (status)
    if (typeof event.data !== "string") return;
    if (!event.data.startsWith("[plugin]")) return;

    const message = event.data.replace("[plugin] ", "").trim();
    console.log("📩 Plugin message:", message);

    if (message.startsWith("✅")) {
      if (!collectedFrames.length) {
        alert("❌ No frames received");
        return;
      }

      // 🖼️ Open tab and send preview
      if (readyToOpenTab && !previewTab) {
        previewTab = window.open("preview.html", "_blank");
      }

      setTimeout(() => {
        previewTab?.postMessage(collectedFrames, "*");
        console.log("📨 Sent frames to preview tab");
      }, 300);
    }

    if (message.startsWith("❌")) {
      alert(message);
    }
  });
});
