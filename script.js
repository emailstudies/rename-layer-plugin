document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.refresh(); // ensure latest state
        app.saveToOE("png"); // export visible canvas
        app.echoToOE("✅ done");
      } catch (e) {
        app.echoToOE("❌ " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[🟡] Sent saveToOE script to Photopea");
  };

  let receivedImage = null;

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      console.log("[🟢] Got image buffer from Photopea");

      // Convert ArrayBuffer to Blob URL
      const blob = new Blob([event.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);

      // Open in new tab
      const tab = window.open();
      if (tab) {
        tab.document.write(
          `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#111;">
            <img src="${url}" style="max-width:100%;max-height:100%;" />
          </body></html>`
        );
        console.log("[✅] Image opened in new tab");
      } else {
        alert("⚠️ Pop-up blocked. Please allow pop-ups for this site.");
      }
    } else if (typeof event.data === "string") {
      console.log("[ℹ️] Log from Photopea:", event.data);
    }
  });
});
