// backend/index.js
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 5000;

// limit: protect server from very long clips (adjust as needed)
const MAX_CLIP_SECONDS = 300; // 5 minutes

app.use(cors());
app.use(express.json());

console.log("ffmpeg binary:", ffmpegPath);

app.get("/", (req, res) => {
  res.send("RingZo backend is running 🎶");
});

app.get("/api/metadata", async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error("YouTube responded with an error");
    }

    const data = await response.json();

    return res.json({
      title: data.title,
      thumbnail_url: data.thumbnail_url,
    });
  } catch (error) {
    console.error("Failed to fetch metadata:", error.message || error);
    return res.status(500).json({ error: "Failed to fetch metadata from YouTube" });
  }
});

/**
 * POST /api/download
 * body: { url: string, startTime: number (seconds), endTime: number (seconds), title?: string }
 *
 * Streams back an MP3 file trimmed to the requested segment.
 */
app.post("/api/download", async (req, res) => {
  try {
    const { url, startTime, endTime, title } = req.body;

    // Basic validation
    if (!url || startTime == null || endTime == null) {
      return res.status(400).json({ error: "Missing url, startTime or endTime" });
    }

    const s = Number(startTime);
    const e = Number(endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) {
      return res.status(400).json({ error: "Invalid startTime/endTime" });
    }

    const duration = e - s;
    if (duration > MAX_CLIP_SECONDS) {
      return res.status(400).json({ error: `Requested clip too long. Max ${MAX_CLIP_SECONDS} seconds.` });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Try to get video info (used to create a nice filename if not provided)
    let info;
    try {
      info = await ytdl.getInfo(url);
    } catch (err) {
      console.error("ytdl getInfo error:", err.message || err);
      return res.status(500).json({ error: "Failed to get video info" });
    }

    const videoTitle = (typeof title === "string" && title.trim().length > 0) ? title.trim() : (info?.videoDetails?.title || "ringzo_clip");
    const safeTitle = videoTitle.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 100);
    const filename = `${safeTitle}.mp3`;

    // Expose header and set download headers
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Start streaming audio from YouTube
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25, // reduce stalling
    });

    // If client disconnects, destroy streams and kill ffmpeg
    let ffmpegCommand = null;
    res.on("close", () => {
      console.log("Client connection closed/aborted");
      try { audioStream.destroy(); } catch (e) {}
      try { if (ffmpegCommand && ffmpegCommand.kill) ffmpegCommand.kill("SIGKILL"); } catch (e) {}
    });

    // Pipe through ffmpeg to trim and convert to mp3
    ffmpegCommand = ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .setStartTime(s)
      .setDuration(duration)
      .on("start", (cmd) => {
        console.log("ffmpeg started:", cmd);
      })
      .on("codecData", (data) => {
        // codecData is helpful for debugging
        console.log("codecData:", data);
      })
      .on("error", (err) => {
        console.error("ffmpeg error:", err.message || err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Processing failed." });
        } else {
          try { res.end(); } catch (e) {}
        }
      })
      .on("end", () => {
        console.log("ffmpeg finished streaming");
      });

    // stream the mp3 to the client
    ffmpegCommand.pipe(res, { end: true });
  } catch (err) {
    console.error("Download route error:", err.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error during download." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
