document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var doc = app.activeDocument;
        if (!doc || doc.layers.length === 0) {
          alert("❌ No document or layers.");
          return;
        }

        // Just use the first visible layer
        var targetLayer = null;
        for (var i = 0; i < doc.layers.length; i++) {
          if (doc.layers[i].visible && doc.layers[i].typename !== "LayerSet") {
            targetLayer = doc.layers[i];
            break;
          }
        }

        if (!targetLayer) {
          alert("❌ No visible layer found.");
          return;
        }

        // Create a new doc for export
        var temp = app.documents.add(doc.width, doc.height, doc.resolution, "_debug_export", NewDocumentMode.RGB);

        // Clear default content
        for (var j = temp.layers.length - 1; j >= 0; j--) {
          try { temp.layers[j].remove(); } catch (e) {}
        }

        // Duplicate layer
        targetLayer.duplicate(temp, ElementPlacement.PLACEATBEGINNING);

        app.activeDocument = temp;
        app.refresh();
        temp.saveToOE("png");

        // Optional: keep the export doc open
        // temp.close(SaveOptions.DONOTSAVECHANGES);

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("📤 Sent minimal saveToOE export script");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      console.log("📥 Got ArrayBuffer from Photopea. Size:", event.data.byteLength);

      const blob = new Blob([event.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

    } else if (typeof event.data === "string") {
      console.log("📩 Message from Photopea:", event.data);
    }
  });
});
