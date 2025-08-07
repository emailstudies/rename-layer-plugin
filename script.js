document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.refresh();
        app.saveToOE("png");
        app.echoToOE("✅ done");
      } catch (e) {
        app.echoToOE("❌ " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[🟡] Sent script to Photopea");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      console.log("[🟢] Got ArrayBuffer from Photopea");

      const blob = new Blob([event.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else if (typeof event.data === "string") {
      console.log("[ℹ️] Log:", event.data);
    }
  });
});
