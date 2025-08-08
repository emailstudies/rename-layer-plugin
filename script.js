document.addEventListener("DOMContentLoaded", () => {
  const renameBtn = document.getElementById("renameBtn");

  renameBtn.addEventListener("click", () => {
    console.log("Rename clicked");

    // Only try resizing if inside an iframe
    if (window.parent !== window) {
      console.log("Sending resize request to Photopea host");
      window.parent.postMessage({
        type: "resizePanel",
        width: 200,   // adjust to your needs
        height: 40    // adjust to your needs
      }, "*");
    } else {
      console.warn("Not inside an iframe — can't resize panel.");
    }

    // Example: send a rename layer command to Photopea
    const newName = document.getElementById("newName").value.trim();
    if (newName) {
      const script = `app.activeDocument.activeLayer.name = "${newName}";`;
      window.parent.postMessage({ type: "eval", script }, "*");
    }
  });
});
