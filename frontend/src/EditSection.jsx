// EditSection.jsx
function EditSection({ videoLink }) {
  const renderEmbed = () => {
    if (!videoLink) return null;

    if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
      const videoIdMatch = videoLink.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      if (!videoId) return <p>Invalid YouTube URL</p>;

      return (
        <iframe
          width="560"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    } else if (videoLink.includes('spotify.com')) {
      return (
        <iframe
          src={`https://open.spotify.com/embed/track/${videoLink.split('/track/')[1]?.split('?')[0]}`}
          width="300"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      );
    }

    return <p>only spotify and youtube for now!</p>;
  };

  return (
    <div className="edit-section">
      <h2>Edit Section</h2>
      <p>Place to trim the song</p>
      <div className="video-preview">
        {renderEmbed()}
      </div>
    </div>
  );
}

export default EditSection;
