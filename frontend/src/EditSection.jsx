// EditSection.jsx
import { useState, useEffect, useRef } from "react";

function EditSection({ videoLink }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const playerRef = useRef(null);

  const formatTime = (seconds, showHours) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (!showHours && hrs === 0) {
      return [mins, secs].map(v => String(v).padStart(2, "0")).join(":");
    }
    return [hrs, mins, secs].map(v => String(v).padStart(2, "0")).join(":");
  };

  const parseTime = (timeStr) => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  useEffect(() => {
    if (videoLink?.includes("youtube.com") || videoLink?.includes("youtu.be")) {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        window.onYouTubeIframeAPIReady = () => initPlayer();
        document.body.appendChild(tag);
      } else {
        initPlayer();
      }
    }
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoLink]);

  const initPlayer = () => {
    if (!videoLink) return;
    const videoIdMatch = videoLink.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return;

    const ytPlayer = new window.YT.Player("yt-player", {
      videoId,
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          const check = setInterval(() => {
            const d = event.target.getDuration();
            if (d > 0) {
              setDuration(Math.floor(d));
              clearInterval(check);
            }
          }, 300);
        },
      },
    });
    playerRef.current = ytPlayer;
  };

  const handlePlayTrimmed = () => {
    if (player && endTime > startTime) {
      player.seekTo(startTime);
      player.playVideo();
      setShowDownloadButton(true);

      const interval = setInterval(() => {
        if (player.getCurrentTime() >= endTime) {
          player.pauseVideo();
          clearInterval(interval);
        }
      }, 300);
    } else {
      alert("Please set a valid start and end time.");
    }
  };

  // --- UPDATED DOWNLOAD HANDLER ---
  const handleDownload = async () => {
    if (!videoLink || endTime <= startTime) {
      return alert("Set a valid start and end time before downloading.");
    }

    setIsProcessing(true);
    try {
      const resp = await fetch("http://localhost:5000/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: videoLink,
          startTime,
          endTime,
          // no hardcoded title
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to process download");
      }

      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // --- GET FILENAME FROM BACKEND ---
      const cd = resp.headers.get("Content-Disposition");
      let filename = "ringzo.mp3"; // fallback
      if (cd) {
        const match = cd.match(/filename="?(.+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename; // ✅ use backend-provided filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderEmbed = () => {
    if (!videoLink) return null;

    if (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) {
      return (
        <div className="video-wrapper">
          <div id="yt-player"></div>
        </div>
      );
    } else if (videoLink.includes("spotify.com")) {
      return (
        <iframe
          src={`https://open.spotify.com/embed/track/${videoLink.split("/track/")[1]?.split("?")[0]}`}
          width="300"
          height="80"
          title="Spotify"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      );
    }

    return <p>Only Spotify and YouTube for now!</p>;
  };

  const showHours = duration >= 3600;

  return (
    <div className="edit-section">
      <h2 className="section-title">✂️ Edit Section</h2>
      <p className="section-subtitle">Trim your favorite part of the track</p>

      <div className="video-preview">{renderEmbed()}</div>

      {(videoLink?.includes("youtube.com") || videoLink?.includes("youtu.be")) && (
        <div className="controls">
          <div className="time-inputs">
            <label>
              Start Time:
              <input
                type="text"
                value={formatTime(startTime, showHours)}
                onChange={(e) => setStartTime(parseTime(e.target.value))}
              />
            </label>
            <label>
              End Time:
              <input
                type="text"
                value={formatTime(endTime, showHours)}
                onChange={(e) => setEndTime(parseTime(e.target.value))}
              />
            </label>
          </div>

          <button onClick={handlePlayTrimmed} className="btn preview-btn">
            ▶️ Preview Cut
          </button>

          {showDownloadButton && (
            <button onClick={handleDownload} className="btn download-btn">
              ⬇️ Download Ringtone
            </button>
          )}

          {isProcessing && (
            <div style={{ marginTop: 10 }}>
              <span className="spin" style={{ marginRight: 8 }}>⏳</span>
              Processing... It may take a few seconds.
            </div>
          )}
        </div>
      )}

      {!videoLink?.includes("youtube.com") && !videoLink?.includes("youtu.be") && (
        <p className="note">Trimming demo only works with YouTube for now.</p>
      )}
    </div>
  );
}

export default EditSection;
