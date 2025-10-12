import express from "express";
import fs from "fs";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const app = express();
const PORT = 5000;

app.use(express.json());
ffmpeg.setFfmpegPath(ffmpegPath);

app.post("/api/download", async (req, res) => {
  try {
    const { url, startTime, endTime, title } = req.body;

    if (!url || startTime == null || endTime == null || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🎵 Downloading video:", url);

    const info = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });

    const tempFile = `./${title.replace(/[^\w\s]/gi, "_")}_temp.mp4`;
    const outputFile = `./${title.replace(/[^\w\s]/gi, "_")}.mp3`;

    // Step 1: Download the raw audio stream
    const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });
    const writeStream = fs.createWriteStream(tempFile);

    audioStream.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log("✅ Audio downloaded. Now converting with FFmpeg...");

      // Step 2: Trim and convert to MP3
      ffmpeg(tempFile)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .outputOptions("-q:a 0")
        .toFormat("mp3")
        .save(outputFile)
        .on("end", () => {
          console.log("🎧 Conversion complete:", outputFile);

          // Step 3: Send file to client and delete temp files
          res.download(outputFile, `${title}.mp3`, (err) => {
            if (err) console.error("❌ Error sending file:", err);
            fs.unlink(tempFile, () => {});
            fs.unlink(outputFile, () => {});
          });
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          res.status(500).json({ error: "Audio conversion failed" });
        });
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
