window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");

  if (!btn) {
    console.error("Rename button not found");
    return;
  }

  btn.addEventListener("click", () => {
    const newName = document.getElementById("newName").value.trim();

    if (!newName) {
      alert("Please enter a valid name.");
      return;
    }

    // Construct the script string and wrap it using Function to help avoid CSP eval block
    const scriptCode = `if(app && app.activeDocument && app.activeDocument.activeLayer){
      app.activeDocument.activeLayer.name = ${JSON.stringify(newName)};
    } else {
      alert("No layer selected.");
    }`;

    const fn = new Function(scriptCode);
    const finalScript = fn.toString();

    console.log("Sending wrapped script to Photopea:", finalScript);

    // Send it to Photopea
    window.parent.postMessage("alert(1)", "*");
  });
});
