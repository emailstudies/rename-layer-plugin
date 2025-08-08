document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - compacting panel");

  if (window.frameElement) {
    window.frameElement.style.width = "200px";
    window.frameElement.style.height = "40px";
    console.log("Applied resize directly to iframe");
  } else {
    console.warn("Not inside Photopea or iframe");
  }
});
