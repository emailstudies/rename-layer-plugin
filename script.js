window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  btn.addEventListener("click", () => {
    const newName = document.getElementById("newName").value.trim();

    if (!newName) {
      alert("Please enter a valid name.");
      return;
    }

    // ✅ Send raw string as required by Photopea Live API
    const script = `app.activeDocument.activeLayer.name = ${JSON.stringify(newName)};`;

    console.log("Sending to Photopea:", script);
    window.parent.postMessage(script, "*");  // Send only a string - this was suggested by Photopea and works
  });
});
