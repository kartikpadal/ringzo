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

app.use(cors());
app.use(express.json());

// simple health
app.get("/", (req, res) => {
  res.send("RingZo backend is running 🎶");
});

// metadata you already had
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
    console.error("Failed to fetch metadata:", error.message);
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

    if (!url || startTime == null || endTime == null) {
      return res.status(400).json({ error: "Missing url, startTime or endTime" });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ error: "endTime must be greater than startTime" });
    }

    const duration = endTime - startTime;

    // sanitize filename
    const safeTitle =
      (typeof title === "string" && title.trim().length > 0
        ? title
        : "ringzo_clip"
      ).replace(/[<>:"/\\|?*\x00-\x1F]/g, "").slice(0, 100);

    const filename = `${safeTitle}.mp3`;

    // Make sure frontend can read Content-Disposition header if it wants:
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // ytdl audio stream (increase highWaterMark to reduce stalling)
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });

    // pipe through ffmpeg -> mp3 and trim
    ffmpeg(audioStream)
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .format("mp3")
      .setStartTime(Number(startTime))
      .setDuration(Number(duration))
      .on("start", (cmd) => {
        console.log("ffmpeg started:", cmd);
      })
      .on("error", (err) => {
        console.error("ffmpeg error:", err);
        // If headers haven't been sent, send JSON error; otherwise just end the stream
        if (!res.headersSent) {
          res.status(500).json({ error: "Processing failed." });
        } else {
          res.end();
        }
      })
      .on("end", () => {
        console.log("ffmpeg finished");
      })
      .pipe(res, { end: true });
  } catch (err) {
    console.error("Download route error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error during download." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
