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

    const fileExtension =
        file.name.split(".").pop().toLowerCase();

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

        return;
    }

    // Display selected file
fileName.textContent = file.name;
fileSize.textContent =
    "File size: " + formatFileSize(file.size);

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
    const preset =
        document.getElementById("preset").value;

    const resolution =
        document.getElementById("resolution").value;


    formData.append("preset", preset);
    formData.append("resolution", resolution);


    try {

        const response = await fetch("/compress", {

            method: "POST",

            body: formData

        });


        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                result.message || "Compression failed."
            );

        }


        console.log(
            "Compression result:",
            result
        );


        // Show result section
        const resultSection =
            document.getElementById("result");

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
        const preview =
            document.getElementById("preview");

        preview.src = result.videoUrl;

        preview.hidden = false;

        preview.load();


        // Enable download button
        const downloadBtn =
            document.getElementById("downloadBtn");

        downloadBtn.hidden = false;

        downloadBtn.onclick = () => {

            const link =
                document.createElement("a");

            link.href =
                result.videoUrl;

            link.download =
                result.fileName;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

        };


        showSuccessPopup();


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong: " +
            error.message
        );

    }


   compressBtn.textContent = "Compress Video";
compressBtn.disabled = false;

loading.hidden = true;
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


    const i =
        Math.floor(
            Math.log(bytes) / Math.log(1024)
        );


    return (
        (bytes / Math.pow(1024, i)).toFixed(2)
        + " "
        + units[i]
    );

}

// =========================
// SUCCESS POPUP
// =========================

function showSuccessPopup() {

    const popup = document.createElement("div");

    popup.className = "success-popup";

    popup.innerHTML = `
        <div class="success-popup-icon">✓</div>

        <div class="success-popup-content">
            <strong>Video compressed successfully!</strong>
            <span>Your video is ready to preview and download.</span>
        </div>

        <button class="success-popup-close">×</button>
    `;

    document.body.appendChild(popup);

    // Show popup
    setTimeout(() => {
        popup.classList.add("show");
    }, 10);

    // Close button
    popup.querySelector(".success-popup-close").addEventListener("click", () => {
        popup.classList.remove("show");

        setTimeout(() => {
            popup.remove();
        }, 300);
    });

    // Automatically disappear after 5 seconds
    setTimeout(() => {

        if (document.body.contains(popup)) {

            popup.classList.remove("show");

            setTimeout(() => {
                popup.remove();
            }, 300);

        }

    }, 5000);
}