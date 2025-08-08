document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - requesting panel resize");

  if (window.parent !== window) {
    parent.postMessage({ type: "resize", width: 200, height: 40 }, "*");
    console.log("Resize request sent to Photopea");
  } else {
    console.warn("Not inside Photopea or iframe");
  }
});
