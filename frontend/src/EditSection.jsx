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
    if (!showHours && hrs === 0) return [mins, secs].map(v => String(v).padStart(2,"0")).join(":");
    return [hrs, mins, secs].map(v => String(v).padStart(2,"0")).join(":");
  };

  const parseTime = (timeStr) => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 2) return parts[0]*60 + parts[1];
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    return 0;
  };

  useEffect(() => {
    if (videoLink?.includes("youtube.com") || videoLink?.includes("youtu.be")) {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        window.onYouTubeIframeAPIReady = () => initPlayer();
        document.body.appendChild(tag);
      } else initPlayer();
    }
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
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
    } else alert("Please set a valid start and end time.");
  };

  const showHours = duration >= 3600;

  return (
    <div className="edit-section">
      <h2>✂️ Edit Section</h2>
      <p>Trim your favorite part of the track</p>

      <div className="video-preview">
        {videoLink && (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) ? (
          <div id="yt-player"></div>
        ) : null}
      </div>

      {videoLink?.includes("youtube.com") || videoLink?.includes("youtu.be") ? (
        <div className="controls">
          <div className="time-inputs">
            <label>
              Start :
              <input type="text" value={formatTime(startTime, showHours)} onChange={e => setStartTime(parseTime(e.target.value))} />
            </label>
            <label>
              End :
              <input type="text" value={formatTime(endTime, showHours)} onChange={e => setEndTime(parseTime(e.target.value))} />
            </label>
          </div>

          <button className="preview-btn" onClick={handlePlayTrimmed}>▶️ Preview Cut</button>

          {showDownloadButton && (
            <a
              href={`https://ringzo-backend.onrender.com/api/download?url=${encodeURIComponent(videoLink)}&startTime=${startTime}&endTime=${endTime}`}
              download
              className="btn download-btn"
            >
              ⬇️ Download
            </a>
          )}

        </div>
      ) : (
        <p>Trimming demo only works with YouTube for now.</p>
      )}
    </div>
  );
}

export default EditSection;
