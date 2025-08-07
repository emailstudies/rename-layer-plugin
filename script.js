document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("❌ Button #renameBtn not found");
    return;
  }

  btn.onclick = () => {
    const script = `(function () {
      try {
        function selectLayerById(id) {
          var desc = new ActionDescriptor();
          var ref = new ActionReference();
          ref.putIdentifier(charIDToTypeID('Lyr '), id);
          desc.putReference(charIDToTypeID('null'), ref);
          desc.putBoolean(charIDToTypeID('MkVs'), false);
          executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
        }

        function hideAllLayersInGroup(group) {
          for (var i = 0; i < group.layers.length; i++) {
            group.layers[i].visible = false;
          }
        }

        var original = app.activeDocument;
        var animGroup = null;

        for (var i = 0; i < original.layers.length; i++) {
          if (original.layers[i].typename === "LayerSet" && original.layers[i].name === "anim_preview") {
            animGroup = original.layers[i];
            break;
          }
        }

        if (!animGroup || animGroup.layers.length < 2) {
          app.echoToOE("❌ anim_preview not found or has < 2 layers");
          return;
        }

        var tempDoc = app.documents.add(original.width, original.height, original.resolution, "_temp_export", NewDocumentMode.RGB);
        app.echoToOE("✅ Created temp doc");

        for (var i = animGroup.layers.length - 1; i >= animGroup.layers.length - 2; i--) {
          var frame = animGroup.layers[i];

          // Hide all, show only current
          hideAllLayersInGroup(animGroup);
          frame.visible = true;
          app.refresh();

          // Select by ID (to avoid DOM crashes)
          original.activeLayer = frame;
          var id = frame.id;
          selectLayerById(id);

          // Duplicate to temp
          var dupDesc = new ActionDescriptor();
          var ref = new ActionReference();
          ref.putIdentifier(charIDToTypeID("Lyr "), id);
          dupDesc.putReference(charIDToTypeID("null"), ref);

          var destRef = new ActionReference();
          destRef.putIdentifier(charIDToTypeID("Dcmn"), tempDoc.id);
          dupDesc.putReference(charIDToTypeID("T   "), destRef);
          dupDesc.putInteger(charIDToTypeID("Vrsn"), 5);
          executeAction(charIDToTypeID("Dplc"), dupDesc, DialogModes.NO);

          app.echoToOE("✅ Exported frame: " + frame.name);
        }

        app.activeDocument = tempDoc;
        app.echoToOE("🧪 Final check: temp doc has " + tempDoc.layers.length + " layers.");

      } catch (e) {
        app.echoToOE("❌ ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🧪 Sent descriptor-based export script");
  };
});
