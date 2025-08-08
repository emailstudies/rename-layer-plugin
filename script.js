// script.js — toggle compact panel via host-executed script
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("renameBtn");
  if (!btn) return console.warn("renameBtn not found");

  // Pick a short, unique substring that matches your plugin iframe src.
  // e.g. your GitHub Pages repo path "rename-layer-plugin"
  const pluginUrlPart = "rename-layer-plugin";

  let compact = false;

  btn.addEventListener("click", () => {
    // toggle state
    compact = !compact;

    if (compact) {
      // compact: ask parent (Photopea) to run a script that shrinks the panel
      const script = `(function(){
        try {
          var iframes = document.querySelectorAll("iframe");
          for (var i=0; i<iframes.length; i++){
            var src = iframes[i].src || "";
            if (src.indexOf("${pluginUrlPart}") !== -1) {
              var panel = iframes[i].closest(".body") || iframes[i].parentElement;
              if (!panel) panel = iframes[i].parentElement;
              // save original inline styles once
              if (!panel._origStyles) {
                panel._origStyles = {
                  width: panel.style.width || "",
                  height: panel.style.height || "",
                  minWidth: panel.style.minWidth || "",
                  maxWidth: panel.style.maxWidth || "",
                  overflow: panel.style.overflow || ""
                };
              }
              // apply compact size (adjust px values as you like)
              panel.style.width = "200px";
              panel.style.height = "20px";
              panel.style.minWidth = "200px";
              panel.style.maxWidth = "200px";
              panel.style.overflow = "hidden";
              iframes[i].style.width = "200px";
              iframes[i].style.height = "20px";
              break;
            }
          }
        } catch(e) { console.error(e); }
      })();`;

      parent.postMessage(script, "*");
      console.log("Compact resize request sent to Photopea host");
    } else {
      // restore: ask parent to restore saved inline styles
      const script = `(function(){
        try {
          var iframes = document.querySelectorAll("iframe");
          for (var i=0; i<iframes.length; i++){
            var src = iframes[i].src || "";
            if (src.indexOf("${pluginUrlPart}") !== -1) {
              var panel = iframes[i].closest(".body") || iframes[i].parentElement;
              if (!panel) panel = iframes[i].parentElement;
              if (panel && panel._origStyles) {
                panel.style.width = panel._origStyles.width;
                panel.style.height = panel._origStyles.height;
                panel.style.minWidth = panel._origStyles.minWidth || "";
                panel.style.maxWidth = panel._origStyles.maxWidth || "";
                panel.style.overflow = panel._origStyles.overflow || "";
                // also restore iframe inline styles
                iframes[i].style.width = panel.style.width || "";
                iframes[i].style.height = panel.style.height || "";
              }
              break;
            }
          }
        } catch(e) { console.error(e); }
      })();`;

      parent.postMessage(script, "*");
      console.log("Restore resize request sent to Photopea host");
    }
  });
});
