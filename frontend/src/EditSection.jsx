// EditSection.jsx
import { useState, useEffect, useRef } from "react";

function EditSection({ videoLink }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
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
        onReady: (event) => setPlayer(event.target),
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

      // Stop playback at endTime
      const interval = setInterval(() => {
        if (player.getCurrentTime() >= endTime) {
          player.pauseVideo();
          clearInterval(interval);
        }
      }, 500);
    }
  };

  const renderEmbed = () => {
    if (!videoLink) return null;

    if (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) {
      return (
        <div>
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

  return (
    <div className="edit-section">
      <h2>Edit Section</h2>
      <p>Place to trim the song</p>
      <div className="video-preview">{renderEmbed()}</div>

      {/* Controls */}
      {videoLink.includes("youtube.com") || videoLink.includes("youtu.be") ? (
        <div className="controls">
          <button onClick={handleSetStart}>Set Start</button>
          <span>Start: {startTime}s</span>

          <button onClick={handleSetEnd}>Set End</button>
          <span>End: {endTime}s</span>

          <button onClick={handlePlayTrimmed}>▶️ Preview Cut</button>
        </div>
      ) : (
        <p>Trimming demo only works with YouTube for now.</p>
      )}
    </div>
  );
}

export default EditSection;
