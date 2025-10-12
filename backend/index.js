// backend/index.js
const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 5000;
const MAX_CLIP_SECONDS = 1000; // max 16 minutes

app.use(cors());
app.use(express.json());

console.log("ffmpeg binary:", ffmpegPath);

app.get("/", (req, res) => {
  res.send("RingZo backend is running 🎶");
});

// --------- METADATA ROUTE ---------
app.get("/api/metadata", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "Missing URL parameter" });

  try {
    const info = await ytdlp(videoUrl, { dumpSingleJson: true, noWarnings: true });
    return res.json({ title: info.title, thumbnail_url: info.thumbnail });
  } catch (err) {
    console.error("Failed to fetch metadata:", err.message || err);
    return res.status(500).json({ error: "Failed to fetch metadata from YouTube" });
  }
});

// --------- DOWNLOAD + TRIM ROUTE ---------
app.post("/api/download", async (req, res) => {
  try {
    const { url, startTime, endTime } = req.body;

    if (!url || startTime == null || endTime == null)
      return res.status(400).json({ error: "Missing url, startTime or endTime" });

    const s = Number(startTime);
    const e = Number(endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s)
      return res.status(400).json({ error: "Invalid startTime/endTime" });

    const duration = e - s;
    if (duration > MAX_CLIP_SECONDS)
      return res.status(400).json({ error: `Requested clip too long. Max ${MAX_CLIP_SECONDS} seconds.` });

    // Validate YouTube URL
    if (!/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/.test(url))
      return res.status(400).json({ error: "Invalid YouTube URL" });

    // Get video title via yt-dlp
    let videoTitle = "ringzo_clip";
    try {
      const info = await ytdlp(url, { dumpSingleJson: true, noWarnings: true });
      if (info?.title) videoTitle = info.title;
    } catch (err) {
      console.error("yt-dlp info error:", err.message || err);
    }

    const safeTitle = videoTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 100);
    const filename = `${safeTitle}.mp3`;

    // Send headers first
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream audio directly from yt-dlp through ffmpeg
    const audioProcess = ytdlp.exec(url, { format: "bestaudio", output: "-" });

    ffmpeg(audioProcess.stdout)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .setStartTime(s)
      .setDuration(duration)
      .on("start", cmd => console.log("ffmpeg started:", cmd))
      .on("error", err => {
        console.error("ffmpeg error:", err.message || err);
        if (!res.headersSent) res.status(500).json({ error: "Processing failed." });
      })
      .pipe(res, { end: true });

    res.on("close", () => {
      console.log("Client connection closed/aborted");
      try { audioProcess.kill("SIGKILL"); } catch (_) {}
    });

  } catch (err) {
    console.error("Download route error:", err.message || err);
    if (!res.headersSent) res.status(500).json({ error: "Server error during download." });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
