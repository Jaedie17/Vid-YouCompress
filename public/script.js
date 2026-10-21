
const videoInput = document.getElementById("videoInput");
const selectVideoBtn = document.getElementById("selectVideoBtn");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const compressBtn = document.getElementById("compressBtn");
const loading = document.getElementById("loading");
const uploadStatus = document.getElementById("uploadStatus");

// Select Video button
selectVideoBtn.addEventListener("click", () => {
    videoInput.click();
});

// When a video is selected
videoInput.addEventListener("change", () => {
    const file = videoInput.files[0];

    if (!file) {
        return;
    }

    // Allowed video formats
    const allowedTypes = [
        "video/mp4",
        "video/x-msvideo",
        "video/quicktime"
    ];

    const fileExtension = file.name.split(".").pop().toLowerCase();

    const allowedExtensions = [
        "mp4",
        "avi",
        "mov"
    ];

    // Check file type
    if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
    ) {
        alert(
            "Invalid file type. Please select an MP4, AVI, or MOV video."
        );

        videoInput.value = "";
        fileName.textContent = "No video selected";
        fileSize.textContent = "File size: -";
        uploadStatus.hidden = true;

        return;
    }

    // Display selected file
    fileName.textContent = file.name;
    fileSize.textContent = "File size: " + formatFileSize(file.size);

    uploadStatus.hidden = false;
});

// Compress Video button
compressBtn.addEventListener("click", async () => {
    const file = videoInput.files[0];

    if (!file) {
        alert("Please select a video first.");
        return;
    }

    compressBtn.textContent = "Compressing...";
    compressBtn.disabled = true;
    loading.hidden = false;
    uploadStatus.hidden = true;

    const formData = new FormData();

    formData.append("video", file);

    // Get compression settings
    const preset = document.getElementById("preset").value;
    const resolution = document.getElementById("resolution").value;

    formData.append("preset", preset);
    formData.append("resolution", resolution);

    try {
        const response = await fetch("/compress", {
            method: "POST",
            body: formData
        });

        const contentType = response.headers.get("content-type");

        let result;

        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            throw new Error(
                "The server could not complete the compression. Please try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message || "Video compression failed. Please try again."
            );
        }

        console.log("Compression result:", result);

        // Show result section
        const resultSection = document.getElementById("result");
        resultSection.hidden = false;

        // Display original size
        document.getElementById("originalSize").textContent =
            formatFileSize(result.originalSize);

        // Display compressed size
        document.getElementById("compressedSize").textContent =
            formatFileSize(result.compressedSize);

        // Display reduction
        document.getElementById("reduction").textContent =
            result.reduction + "%";

        // Show compressed video preview
        const preview = document.getElementById("preview");

        preview.src = result.videoUrl;
        preview.hidden = false;
        preview.load();

        // Enable download button
        const downloadBtn = document.getElementById("downloadBtn");

        downloadBtn.hidden = false;

        // Replace the previous download handler
        downloadBtn.onclick = () => {
            const link = document.createElement("a");

            link.href = result.videoUrl;
            link.download = result.fileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show download confirmation and offer another compression
            showDownloadPopup();
        };

        // Show compression success popup
        showSuccessPopup();

    } catch (error) {
        console.error(error);

        alert(
            "Something went wrong: " + error.message
        );

    } finally {
        compressBtn.textContent = "Compress Video";
        compressBtn.disabled = false;
        loading.hidden = true;
    }
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return (
        (bytes / Math.pow(1024, i)).toFixed(2)
        + " "
        + units[i]
    );
}

// =========================
// CREATE POPUP
// =========================

function createPopup(className, content) {
    // Remove an existing popup of the same type
    const existingPopup = document.querySelector("." + className);

    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement("div");
    popup.className = className;
    popup.innerHTML = content;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.classList.add("show");
    });

    return popup;
}

// =========================
// COMPRESSION SUCCESS POPUP
// =========================

function showSuccessPopup() {
    const popup = createPopup(
        "success-popup",
        `
            <div class="success-popup-icon">✓</div>

            <div class="success-popup-content">
                <strong>Video compressed successfully!</strong>
                <span>Your video is ready to preview and download.</span>
            </div>

            <button class="success-popup-close" aria-label="Close">×</button>
        `
    );

    popup.querySelector(".success-popup-close").addEventListener("click", () => {
        popup.classList.remove("show");

        setTimeout(() => {
            popup.remove();
        }, 300);
    });

    setTimeout(() => {
        if (document.body.contains(popup)) {
            popup.classList.remove("show");

            setTimeout(() => {
                popup.remove();
            }, 300);
        }
    }, 5000);
}

// =========================
// DOWNLOAD SUCCESS POPUP
// =========================

function showDownloadPopup() {
    const popup = createPopup(
        "download-popup",
        `
            <div class="download-popup-icon">✓</div>

            <div class="download-popup-content">
                <strong>Download started!</strong>
                <span>Your compressed video download has been initiated.</span>

                <button class="compress-again-btn">
                    Compress a Video Again
                </button>
            </div>

            <button class="download-popup-close" aria-label="Close">×</button>
        `
    );

    // Refresh the website for another compression
    popup.querySelector(".compress-again-btn").addEventListener("click", () => {
        window.location.reload();
    });

    // Close popup without refreshing
    popup.querySelector(".download-popup-close").addEventListener("click", () => {
        popup.classList.remove("show");

        setTimeout(() => {
            popup.remove();
        }, 300);
    });
}
