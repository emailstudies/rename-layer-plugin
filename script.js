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

        var doc = app.activeDocument;
        var animGroup = null;

        for (var i = 0; i < doc.layers.length; i++) {
          if (doc.layers[i].typename === "LayerSet" && doc.layers[i].name === "anim_preview") {
            animGroup = doc.layers[i];
            break;
          }
        }

        if (!animGroup || animGroup.layers.length < 1) {
          app.echoToOE("❌ 'anim_preview' group not found or empty.");
          return;
        }

        var topLayer = animGroup.layers[animGroup.layers.length - 1];
        var tempDoc = app.documents.add(doc.width, doc.height, doc.resolution, "_temp_export", NewDocumentMode.RGB);

        app.echoToOE("✅ Created temp doc");

        // Ensure only this layer is visible
        for (var i = 0; i < animGroup.layers.length; i++) {
          animGroup.layers[i].visible = false;
        }
        topLayer.visible = true;
        app.refresh();

        // Select and duplicate using descriptor
        doc.activeLayer = topLayer;
        selectLayerById(topLayer.id);

        var dupDesc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putIdentifier(charIDToTypeID("Lyr "), topLayer.id);
        dupDesc.putReference(charIDToTypeID("null"), ref);

        var destRef = new ActionReference();
        destRef.putIdentifier(charIDToTypeID("Dcmn"), tempDoc.id);
        dupDesc.putReference(charIDToTypeID("T   "), destRef);
        dupDesc.putInteger(charIDToTypeID("Vrsn"), 5);

        executeAction(charIDToTypeID("Dplc"), dupDesc, DialogModes.NO);

        app.activeDocument = tempDoc;
        app.echoToOE("✅ Duplicated top layer to temp doc. Layers in temp: " + tempDoc.layers.length);

      } catch (e) {
        app.echoToOE("❌ JS ERROR: " + e.message);
      }
    })();`;

    parent.postMessage(script, "*");
    console.log("[flipbook] 🧪 Sent minimal descriptor export script");
  };
});
