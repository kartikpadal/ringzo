// backend/index.js
const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 5000;
const MAX_CLIP_SECONDS = 1000; //approx 16 minutes

app.use(cors({
  origin: "*", // allow your frontend
  exposedHeaders: ["Content-Disposition"], // allow filename to be read if needed
}));
app.use(express.json());

console.log("ffmpeg binary:", ffmpegPath);

app.get("/", (req, res) => res.send("RingZo backend running 🎶"));

// METADATA
app.get("/api/metadata", async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "Missing URL parameter" });

  try {
    const info = await ytdlp(videoUrl, { dumpSingleJson: true, noWarnings: true });
    return res.json({ title: info.title, thumbnail_url: info.thumbnail });
  } catch (err) {
    console.error("Failed to fetch metadata:", err);
    return res.status(500).json({ error: "Failed to fetch metadata from YouTube" });
  }
});

// DOWNLOAD + TRIM
app.get("/api/download", async (req, res) => {
  try {
    const { url, startTime, endTime } = req.query;
    if (!url || startTime == null || endTime == null)
      return res.status(400).send("Missing url, startTime, or endTime");

    const s = Number(startTime);
    const e = Number(endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s)
      return res.status(400).send("Invalid startTime/endTime");

    if (e - s > MAX_CLIP_SECONDS)
      return res.status(400).send(`Clip too long. Max ${MAX_CLIP_SECONDS} seconds`);

    // Fetch info for title
    const info = await ytdlp(url, { dumpSingleJson: true, noWarnings: true });
    const safeTitle = info.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 100);
    const filename = `${safeTitle}.mp3`;

    // headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "audio/mpeg");

    // pipe yt-dlp -> ffmpeg -> res
    ffmpeg(ytdlp.exec(url, { format: "bestaudio", output: "-" }).stdout)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .setStartTime(s)
      .setDuration(e - s)
      .format("mp3")
      .on("start", cmd => console.log("ffmpeg started:", cmd))
      .on("error", err => {
        console.error("ffmpeg error:", err);
        try { res.end(); } catch {}
      })
      .pipe(res, { end: true });

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Server error during download");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
