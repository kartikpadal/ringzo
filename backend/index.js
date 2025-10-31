const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 5000;
const MAX_CLIP_SECONDS = 1000; // approx 16 minutes

app.use(cors({
  origin: "*",
  exposedHeaders: ["Content-Disposition"],
}));
app.use(express.json());

console.log("ffmpeg binary:", ffmpegPath);

app.get("/", (req, res) => res.send("RingZo backend running 🎶"));

// =============================================================
// 🎵 FETCH METADATA
// =============================================================
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

// =============================================================
// 🎧 DOWNLOAD + TRIM AUDIO
// =============================================================
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

    // Get video info for filename
    const info = await ytdlp(url, { dumpSingleJson: true, noWarnings: true });
    const safeTitle = info.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 100);
    const filename = `${safeTitle}.mp3`;

    // Set headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "audio/mpeg");

    // ✅ FIX: manually spawn yt-dlp for stream
    const ytProcess = spawn("yt-dlp", ["-f", "bestaudio", "-o", "-", url], {
      stdio: ["ignore", "pipe", "inherit"],
    });

    // ✅ Pipe yt-dlp -> ffmpeg -> response
    ffmpeg(ytProcess.stdout)
      .setFfmpegPath(ffmpegPath)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .setStartTime(s)
      .setDuration(e - s)
      .format("mp3")
      .on("start", (cmd) => console.log("ffmpeg started:", cmd))
      .on("stderr", (line) => console.log("ffmpeg log:", line))
      .on("error", (err) => {
        console.error("ffmpeg error:", err);
        try { res.end(); } catch {}
      })
      .on("end", () => console.log("✅ Conversion finished successfully"))
      .pipe(res, { end: true });

  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Server error during download");
  }
});

// =============================================================
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
