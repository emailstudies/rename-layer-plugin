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

        // Get first visible pixel layer
        var targetLayer = null;
        for (var i = 0; i < doc.layers.length; i++) {
          var layer = doc.layers[i];
          if (layer.visible && layer.typename !== "LayerSet") {
            targetLayer = layer;
            break;
          }
        }

        if (!targetLayer) {
          alert("❌ No visible pixel layer.");
          return;
        }

        // Create new export doc
        var temp = app.documents.add(doc.width, doc.height, doc.resolution, "_debug_export", NewDocumentMode.RGB);

        // Remove the default layer from new doc
        while (temp.layers.length > 0) {
          try { temp.layers[0].remove(); } catch (e) {}
        }

        // Switch back to original to duplicate from
        app.activeDocument = doc;
        targetLayer.duplicate(temp, ElementPlacement.PLACEATBEGINNING);

        // Switch to export doc
        app.activeDocument = temp;
        app.refresh();

        temp.saveToOE("png");

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
