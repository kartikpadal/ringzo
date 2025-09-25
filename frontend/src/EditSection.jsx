// EditSection.jsx
import { useState, useEffect, useRef } from "react";

function EditSection({ videoLink }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const playerRef = useRef(null);

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

  const handleSetStart = () => {
    if (player) setStartTime(Math.floor(player.getCurrentTime()));
  };

  const handleSetEnd = () => {
    if (player) setEndTime(Math.floor(player.getCurrentTime()));
  };

  const handlePlayTrimmed = () => {
    if (player && endTime > startTime) {
      player.seekTo(startTime);
      player.playVideo();

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

  return (
    <div className="edit-section">
      <h2 className="section-title">✂️ Edit Section</h2>
      <p className="section-subtitle">Trim your favorite part of the track</p>

      <div className="video-preview">{renderEmbed()}</div>

      {videoLink.includes("youtube.com") || videoLink.includes("youtu.be") ? (
        <div className="controls">
          {/* Start & End buttons */}
          <div className="trim-buttons">
            <button onClick={handleSetStart} className="btn start-btn">
              Set Start ({startTime}s)
            </button>
            <button onClick={handleSetEnd} className="btn end-btn">
              Set End ({endTime}s)
            </button>
          </div>

          {/* Input boxes instead of sliders */}
          <div className="time-inputs">
            <label>
              Start Time:
              <input
                type="number"
                min="0"
                max={duration}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
              />
            </label>
            <label>
              End Time:
              <input
                type="number"
                min="0"
                max={duration}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
            </label>
          </div>

          {/* Preview Button */}
          <button onClick={handlePlayTrimmed} className="btn preview-btn">
            ▶️ Preview Cut
          </button>
        </div>
      ) : (
        <p className="note">Trimming demo only works with YouTube for now.</p>
      )}
    </div>
  );
}

export default EditSection;
