// EditSection.jsx
import { useState, useEffect, useRef } from "react";

function EditSection({ videoLink }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const playerRef = useRef(null);

  // Helper: format seconds -> hh:mm:ss or mm:ss
  const formatTime = (seconds, showHours) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (!showHours && hrs === 0) {
      return [mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
    }
    return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Helper: parse hh:mm:ss or mm:ss -> seconds
  const parseTime = (timeStr) => {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // mm:ss
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
    }
    return 0;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (videoLink?.includes("youtube.com") || videoLink?.includes("youtu.be")) {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        window.onYouTubeIframeAPIReady = () => {
          initPlayer();
        };
        document.body.appendChild(tag);
      } else {
        initPlayer();
      }
    }
  }, [videoLink]);

  const initPlayer = () => {
    const videoIdMatch = videoLink.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return;

    const ytPlayer = new window.YT.Player("yt-player", {
      videoId,
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          setDuration(event.target.getDuration());
        },
      },
    });
    playerRef.current = ytPlayer;
  };

  const handlePlayTrimmed = () => {
    if (player && endTime > startTime) {
      player.seekTo(startTime);
      player.playVideo();

      // Show download button immediately after clicking Preview
      setShowDownloadButton(true);

      const interval = setInterval(() => {
        if (player.getCurrentTime() >= endTime) {
          player.pauseVideo();
          clearInterval(interval);
        }
      }, 300);
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
          src={`https://open.spotify.com/embed/track/${
            videoLink.split("/track/")[1]?.split("?")[0]
          }`}
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

      {videoLink.includes("youtube.com") || videoLink.includes("youtu.be") ? (
        <div className="controls">
          {/* Time input boxes */}
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

          {/* Preview Button */}
          <button onClick={handlePlayTrimmed} className="btn preview-btn">
            ▶️ Preview Cut
          </button>

          {/* Download Button (shown immediately after clicking preview) */}
          {showDownloadButton && (
            <button className="btn download-btn">⬇️ Download</button>
          )}
        </div>
      ) : (
        <p className="note">Trimming demo only works with YouTube for now.</p>
      )}
    </div>
  );
}

export default EditSection;
