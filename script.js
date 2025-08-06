document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button not found");
    return;
  }

  const collectedFrames = [];
  let imageDataURLs = [];
  let previewWindow = null;

  btn.onclick = () => {
    const script = `(function () {
      try {
        var original = app.activeDocument;
        app.echoToOE("[flipbook] 🔍 Starting flipbook export...");

        // 🔍 Locate anim_preview
        var animGroup = null;
        for (var i = 0; i < original.layers.length; i++) {
          var layer = original.layers[i];
          if (layer.typename === "LayerSet" && layer.name === "anim_preview") {
            animGroup = layer;
            break;
          }
        }

        if (!animGroup) {
          app.echoToOE("❌ Folder 'anim_preview' not found.");
          return;
        }

        // 🎯 Collect all visible sublayers (ArtLayer, SmartObjects etc.)
        var frameLayers = [];
        for (var i = 0; i < animGroup.layers.length; i++) {
          var sub = animGroup.layers[i];
          if (sub.visible !== undefined) {
            frameLayers.push(sub);
            app.echoToOE("[flipbook] 🧩 Frame added: " + sub.name);
          }
        }

        if (frameLayers.length === 0) {
          app.echoToOE("❌ No valid layers found in 'anim_preview'");
          return;
        }

        app.echoToOE("[flipbook] ✅ Total frames: " + frameLayers.length);

        // 📄 Create _temp_export doc
        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.activeDocument = tempDoc;

        // ❌ Remove default layers
        for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
          try { tempDoc.layers[j].remove(); } catch (e) {}
        }

        // 📦 Loop through each frame
        for (var i = 0; i < frameLayers.length; i++) {
          var frameLayer = frameLayers[i];

          // 👁️ Hide everything else in animGroup
          for (var j = 0; j < animGroup.layers.length; j++) {
            animGroup.layers[j].visible = false;
          }

          frameLayer.visible = true;
          app.echoToOE("[flipbook] 👁️ Only visible: " + frameLayer.name);

          // 🔁 Duplicate to tempDoc
          app.activeDocument = original;
          var duplicated = null;
          try {
            duplicated = frameLayer.duplicate(tempDoc, ElementPlacement.PLACEATBEGINNING);
          } catch (e) {
            app.echoToOE("[flipbook] ❌ Failed to duplicate: " + frameLayer.name + " | " + e.message);
            continue;
          }

          app.activeDocument = tempDoc;
          app.refresh();

          if (!duplicated) {
            app.echoToOE("[flipbook] ❌ Duplication returned null for: " + frameLayer.name);
            continue;
          }

          app.echoToOE("[flipbook] ✅ Duplicated to tempDoc: " + duplicated.name);

          // ❌ Delete all other layers except the one we duplicated
          for (var j = tempDoc.layers.length - 1; j >= 0; j--) {
            if (tempDoc.layers[j] !== duplicated) {
              app.echoToOE("[flipbook] ❌ Removing: " + tempDoc.layers[j].name);
              try { tempDoc.layers[j].remove(); } catch (e) {}
            }
          }

          // 🧯 Fallback if no layers exist
          if (tempDoc.layers.length === 0) {
            var dummy = tempDoc.artLayers.add();
            dummy.name = "fallback_dummy";
            app.echoToOE("[flipbook] ⚠️ Dummy layer added to avoid crash");
          }

          app.echoToOE("[flipbook] ✅ Final layer in tempDoc: " + tempDoc.layers[0].name);
          tempDoc.saveToOE("png");
          app.echoToOE("[flipbook] 📸 Exported: " + frameLayer.name);
        }

        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.echoToOE("✅ done");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 📤 Sent refined export script to Photopea");
  };

  window.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
      collectedFrames.push(event.data);
    } else if (typeof event.data === "string") {
      const msg = event.data;
      console.log("[flipbook] 📩 Message from Photopea:", msg);

      if (msg === "✅ done") {
        if (collectedFrames.length === 0) {
          alert("❌ No frames received.");
          return;
        }

        imageDataURLs = collectedFrames.map((ab) => {
          const binary = String.fromCharCode(...new Uint8Array(ab));
          return "data:image/png;base64," + btoa(binary);
        });

        previewWindow = window.open("preview.html");
        previewWindow.onload = () => {
          previewWindow.postMessage({ type: "images", images: imageDataURLs }, "*");
        };

        collectedFrames.length = 0;
      } else if (msg.startsWith("❌")) {
        console.error("[flipbook] ⚠️ Error from Photopea:", msg);
      } else {
        console.log("[flipbook] ℹ️", msg);
      }
    }
  });
});
