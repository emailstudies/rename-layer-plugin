document.getElementById("renameBtn").addEventListener("click", () => {
  console.log("Rename clicked - compacting panel");

  if (window.frameElement) {
    window.frameElement.style.height = "20px"; // compact height
    window.frameElement.style.width = "300px"; // optional
    console.log("Panel resized from inside iframe");
  } else {
    console.warn("No frameElement found — not inside iframe?");
  }
});
