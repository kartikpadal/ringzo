// backend/index.js
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 5000;

// ✅ Update with your verified yt-dlp path
const YTDLP_PATH = "C:\\Users\\Padal\\AppData\\Roaming\\Python\\Python313\\Scripts\\yt-dlp.exe";

app.use(cors({ origin: "*" }));
app.use(express.json());

console.log("ffmpeg binary:", ffmpegPath);
console.log("yt-dlp binary:", YTDLP_PATH);

app.get("/", (_, res) => res.send("RingZo backend running 🎶"));

// =============================================================
// 🎵 FETCH METADATA
// =============================================================
app.get("/api/metadata", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).json({ error: "Missing URL parameter" });

  const ytdlp = spawn(YTDLP_PATH, ["--dump-json", videoUrl]);

  let data = "";
  ytdlp.stdout.on("data", (chunk) => (data += chunk.toString()));

  ytdlp.stderr.on("data", (err) => console.error("yt-dlp stderr:", err.toString()));

  ytdlp.on("close", (code) => {
    if (code !== 0) {
      console.error("yt-dlp exited with code", code);
      return res.status(500).json({ error: "Failed to fetch metadata from YouTube" });
    }

    try {
      const info = JSON.parse(data);
      return res.json({
        title: info.title,
        thumbnail_url: info.thumbnail,
      });
    } catch (err) {
      console.error("Metadata parse error:", err);
      return res.status(500).json({ error: "Failed to parse video info" });
    }
  });
});

// =============================================================
// 🎧 DOWNLOAD + TRIM AUDIO
// =============================================================
app.get("/api/download", (req, res) => {
  const { url, startTime, endTime } = req.query;

  if (!url || startTime == null || endTime == null)
    return res.status(400).send("Missing url, startTime, or endTime");

  const s = Number(startTime);
  const e = Number(endTime);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s)
    return res.status(400).send("Invalid startTime/endTime");

  const duration = e - s;
  console.log(`🎬 Trimming from ${s}s to ${e}s`);

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Disposition", 'attachment; filename="ringzo.mp3"');

  // ✅ Spawn yt-dlp to stream bestaudio in m4a container
  const ytdlp = spawn(YTDLP_PATH, [
    "-f", "bestaudio",
    "-o", "-",             // output to stdout
    "--audio-format", "m4a",
    url
  ], { stdio: ["ignore", "pipe", "ignore"] });

  // ✅ Pipe yt-dlp -> ffmpeg -> response
  ffmpeg(ytdlp.stdout)
    .setStartTime(s)
    .setDuration(duration)
    .audioCodec("libmp3lame")
    .audioBitrate(128)
    .format("mp3")
    .on("start", (cmd) => console.log("ffmpeg started:", cmd))
    .on("stderr", (line) => console.log("ffmpeg log:", line))
    .on("error", (err) => {
      console.error("ffmpeg error:", err.message);
      try { res.end(); } catch {}
    })
    .on("end", () => console.log("✅ Conversion finished"))
    .pipe(res, { end: true });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
