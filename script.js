document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        app.echoToOE("[flipbook] 🚀 Running export test");

        var original = app.activeDocument;
        if (!original || original.layers.length === 0) {
          app.echoToOE("❌ No document or layers found.");
          return;
        }

        // 🔍 Find anim_preview group
        var animGroup = null;
        for (var i = 0; i < original.layers.length; i++) {
          var layer = original.layers[i];
          if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
            animGroup = layer;
            break;
          }
        }

        if (!animGroup || animGroup.layers.length < 1) {
          app.echoToOE("❌ 'anim_preview' group missing or empty.");
          return;
        }

        // 🧼 Hide all frames initially
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }

        // ✅ Create temp doc and make sure it's initialized
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = tempDoc;
        app.refresh();
        app.echoToOE("[flipbook] 🧪 Created and focused temp doc");

        // 🧪 Export only 2 frames for testing
        var maxFrames = Math.min(2, animGroup.layers.length);

        for (var i = 0; i < maxFrames; i++) {
          var frame = animGroup.layers[i];

          // 🔁 Hide all and show only current
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = (j === i);
          }

          app.activeDocument = original;
          app.refresh();
          app.echoToOE("[flipbook] 🎞 Exporting frame " + (i + 1) + ": " + frame.name);

          // 🗑 Clear previous layers in temp
          app.activeDocument = tempDoc;
          for (var k = tempDoc.layers.length - 1; k >= 0; k--) {
            try { tempDoc.layers[k].remove(); } catch (e) {}
          }
          app.refresh();

          // 🔁 Duplicate visible frame into temp
          app.activeDocument = original;
          original.activeLayer = frame;
          frame.visible = true;

          // ⏳ Failsafe: Ensure tempDoc is still valid
          if (!tempDoc || typeof tempDoc !== "object" || !("name" in tempDoc)) {
            app.echoToOE("❌ tempDoc invalid at frame " + (i + 1));
            return;
          }

          // 📥 Duplicate to temp
          try {
            frame.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
            app.echoToOE("[flipbook] ✅ Duplicated: " + frame.name);
          } catch (e) {
            app.echoToOE("❌ Failed to duplicate frame " + (i + 1) + ": " + e.message);
          }

          // 🖼 Export PNG
          app.activeDocument = tempDoc;
          app.refresh();
          tempDoc.saveToOE("png");
        }

        // Leave temp open for inspection
        app.echoToOE("[flipbook] 🧯 Done test export (temp kept open)");

      } catch (err) {
        app.echoToOE("❌ ERROR: " + err.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent test export script to Photopea");
  };
});
