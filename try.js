// try.js
window.onload = function () {
    var playing = false;
    var frameIndex = 0;
    var timer = null;
    var reverse = false;
    var pingpong = false;
    var direction = 1;
    var delay = 1000 / 12; // default 12 fps

    document.getElementById("renameBtn").onclick = function () {
        if (playing) return;
        playing = true;

        reverse = document.getElementById("reverseChk").checked;
        pingpong = document.getElementById("pingpongChk").checked;

        // Determine delay from FPS or manual delay
        var manualDelay = parseFloat(document.getElementById("manualDelay").value);
        if (!isNaN(manualDelay) && manualDelay > 0) {
            delay = manualDelay * 1000;
        } else {
            var fps = parseFloat(document.getElementById("fpsSelect").value);
            delay = 1000 / (isNaN(fps) || fps <= 0 ? 12 : fps);
        }

        // Optional start/stop frames from input
        var startFrame = parseInt(document.getElementById("startFrameInput").value, 10) || 1;
        var stopFrame = parseInt(document.getElementById("stopFrameInput").value, 10) || null;

        // ==== Get folder/layer structure from Photopea ====
        var doc = app.activeDocument;
        var topGroups = [];
        for (var i = 0; i < doc.layers.length; i++) {
            var lyr = doc.layers[i];
            if (lyr.layers && lyr.layers.length > 0) {
                topGroups.push({
                    ref: lyr,
                    frames: lyr.layers.slice() // copy array of layers
                });
            }
        }

        // Find maximum frame count
        var maxFrames = 0;
        topGroups.forEach(function (grp) {
            if (grp.frames.length > maxFrames) maxFrames = grp.frames.length;
        });

        // Clamp stopFrame to maxFrames
        if (stopFrame && stopFrame > maxFrames) stopFrame = maxFrames;

        // Set initial frameIndex to startFrame-1 (zero-based)
        frameIndex = Math.max(0, startFrame - 1);

        // Animation loop
        timer = setInterval(function () {
            // Show/hide per group
            topGroups.forEach(function (grp) {
                // Hide all first
                grp.frames.forEach(function (layer) {
                    layer.visible = false;
                });

                // Show current frame if exists
                if (frameIndex < grp.frames.length) {
                    grp.frames[frameIndex].visible = true;
                }
            });

            // Advance frame index
            if (reverse) {
                frameIndex -= direction;
            } else {
                frameIndex += direction;
            }

            // Handle pingpong
            if (pingpong) {
                if (frameIndex >= (stopFrame || maxFrames) || frameIndex < (startFrame - 1)) {
                    direction *= -1;
                    frameIndex += direction * 2;
                }
            } else {
                // Normal looping
                if (frameIndex >= (stopFrame || maxFrames)) frameIndex = startFrame - 1;
                if (frameIndex < (startFrame - 1)) frameIndex = (stopFrame || maxFrames) - 1;
            }

        }, delay);
    };

    document.getElementById("stopBtn").onclick = function () {
        playing = false;
        clearInterval(timer);
        frameIndex = 0;
    };
};
