document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #addDummyBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        var doc = app.activeDocument;
        if (!doc || doc.layers.length === 0) {
          alert("❌ No active document or layers.");
          return;
        }

        // Find 'anim_preview' folder
        var animFolder = null;
        for (var i = 0; i < doc.layers.length; i++) {
          if (doc.layers[i].name === "anim_preview" && doc.layers[i].typename === "LayerSet") {
            animFolder = doc.layers[i];
            break;
          }
        }

        if (!animFolder) {
          alert("❌ Folder 'anim_preview' not found.");
          return;
        }

        // Create transparent dummy layer
        app.activeDocument = doc;
        var dummy = doc.artLayers.add();
        dummy.name = "dummy";
        dummy.opacity = 0;
        dummy.visible = false;

        // Move dummy to bottom of anim_preview
        dummy.move(animFolder.layers[animFolder.layers.length - 1], ElementPlacement.PLACEAFTER);

        alert("✅ Dummy layer added to 'anim_preview'.");
      } catch (e) {
        alert("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("📤 Sent dummy layer insertion script to Photopea");
  };
});
