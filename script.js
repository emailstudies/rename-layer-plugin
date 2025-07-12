window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("addLayerBtn");

  if (!btn) {
    console.error("Add Layer button not found");
    return;
  }

  btn.addEventListener("click", () => {
    const newName = document.getElementById("newName").value.trim();

    if (!newName) {
      alert("Please enter a valid name.");
      return;
    }

    const jsxScript = `
      if (app && app.activeDocument) {
        var newLayer = app.activeDocument.artLayers.add();
        newLayer.name = ${JSON.stringify(newName)};
      } else {
        alert("No document open.");
      }
    `;

    console.log("Sending script to Photopea:", jsxScript);

    window.parent.postMessage({
      type: "ppScript",
      script: jsxScript
    }, "*");
  });
});
