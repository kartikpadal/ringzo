const ytdl = require("@distube/ytdl-core");

const testUrl = "https://www.youtube.com/watch?v=4Bsc2uI_LsM"; // use any working video link

(async () => {
  try {
    console.log("Testing ytdl.getInfo for:", testUrl);
    const info = await ytdl.getInfo(testUrl);
    console.log("✅ Video title:", info.videoDetails.title);
  } catch (err) {
    console.error("❌ Failed to get video info:", err.message);
  }
})();
