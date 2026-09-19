const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn("ffprobe", [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            filePath
        ]);

        let output = "";

        ffprobe.stdout.on("data", (data) => {
            output += data.toString();
        });

        ffprobe.on("close", (code) => {
            if (code !== 0) {
                reject(new Error("Could not read video duration."));
                return;
            }

            resolve(parseFloat(output.trim()));
        });
    });
}
const app = express();


// Serve the website
app.use(express.static("public"));


// Make uploaded and compressed videos accessible
app.use("/uploads", express.static("uploads"));
app.use("/compressed", express.static("compressed"));


// Configure uploaded video storage
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);

    }

});


const upload = multer({
    storage: storage
});


// Compress video
app.post("/compress", upload.single("video"), async (req, res) => {

    if (!req.file) {

        return res.status(400).json({
            message: "No video file uploaded."
        });

    }


    const inputPath = req.file.path;

    const originalName =
        path.parse(req.file.originalname).name;

    const outputFileName =
        Date.now() + "-" + originalName + "-compressed.mp4";

    const outputPath =
        path.join("compressed", outputFileName);


    // Get compression settings
    const preset = req.body.preset || "balanced";
    const resolution = req.body.resolution || "720";


    // FFmpeg settings
 // Get video duration
const duration = await getVideoDuration(inputPath);

let targetRatio;
let ffmpegPreset;
let audioBitrate;

if (preset === "high") {
    targetRatio = 0.85;
    ffmpegPreset = "veryfast";
    audioBitrate = 128;
} else if (preset === "fast") {
    targetRatio = 0.55;
    ffmpegPreset = "ultrafast";
    audioBitrate = 96;
} else {
    targetRatio = 0.70;
    ffmpegPreset = "superfast";
    audioBitrate = 112;
}

// Calculate target total bitrate based on original file size
const originalBits = req.file.size * 8;

const targetTotalBitrate =
    (originalBits * targetRatio) / duration / 1000;

// Reserve some bitrate for audio
const calculatedVideoBitrate =
    Math.max(
        100,
        Math.floor(targetTotalBitrate - audioBitrate)
    );

const videoBitrate =
    calculatedVideoBitrate + "k";

    
    // Start FFmpeg
    const ffmpeg = spawn("ffmpeg", [

        "-i",
        inputPath,

        "-vf",
        `scale=-2:${resolution}`,

        "-b:v",
        videoBitrate,

        "-c:v",
        "libx264",
"-preset",
ffmpegPreset,

        "-c:a",
        "aac",

       "-b:a",
audioBitrate + "k",

        "-y",

        outputPath

    ]);


    let ffmpegError = "";


    ffmpeg.stderr.on("data", (data) => {

        ffmpegError += data.toString();

    });


    ffmpeg.on("close", (code) => {

        if (code !== 0) {

            console.error("FFmpeg error:");
            console.error(ffmpegError);

            return res.status(500).json({
                message: "Video compression failed."
            });

        }


        // Get compressed file size
        const compressedSize =
            fs.statSync(outputPath).size;


        // Calculate percentage reduction
        const reduction =
            (
                (
                    (req.file.size - compressedSize)
                    / req.file.size
                ) * 100
            ).toFixed(2);


        // Delete original uploaded file
        fs.unlinkSync(inputPath);


        res.json({

            message: "Video compressed successfully.",

            originalSize: req.file.size,

            compressedSize: compressedSize,

            reduction: reduction,

            videoUrl:
                "/compressed/" + outputFileName,

            fileName:
                outputFileName

        });

    });

});


// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Server running on port ${PORT}`
    );
});