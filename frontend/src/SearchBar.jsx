import { useState } from 'react';
import { BsArrowRight } from 'react-icons/bs';
import { FaSpinner, FaSpotify, FaYoutube, FaCut } from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx';

function SearchBar({ onSubmit, onEditClick }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const validateLink = (url) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;

      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        setPlatform('YouTube');
        return true;
      } else if (hostname.includes('spotify.com')) {
        setPlatform('Spotify');
        return true;
      } else {
        setPlatform('');
        return false;
      }
    } catch {
      return false;
    }
  };

 const fetchMetadata = async (videoLink) => {
  try {
    const response = await fetch(`http://localhost:5000/api/metadata?url=${encodeURIComponent(videoLink)}`);
    if (!response.ok) throw new Error('Failed to fetch metadata');
    const data = await response.json();
    setMetadata(data);
  } catch (err) {
    console.error('Error fetching metadata:', err);
    setError('Failed to fetch video info.');
    setMetadata(null);
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = () => {
    if (!link.trim()) {
      setError('Link cannot be empty.');
      setPlatform('');
      setMetadata(null);
      return;
    }

    const isValid = validateLink(link);
    if (!isValid) {
      setError('Please enter a valid YouTube or Spotify link.');
      setPlatform('');
      setMetadata(null);
      return;
    }

    setError('');
    setLoading(true);
    onSubmit(link);
    fetchMetadata(link);
  };

  const handleClear = () => {
    setLink('');
    setError('');
    setPlatform('');
    setMetadata(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="searchbar-wrapper">
      <div className="searchbar-container">
        <input
          type="text"
          placeholder="Paste Spotify, YouTube, or music link..."
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError('');
            setPlatform('');
            setMetadata(null);
          }}
          onKeyDown={handleKeyDown}
          className="searchbar-input"
        />
        {link && (
          <>
            <button className="searchbar-cross-icon-button" onClick={handleClear} title="Clear input">
              <RxCross2 size={22} />
            </button>
            <div className="searchbar-separator" />
          </>
        )}
        <button onClick={handleSubmit} className="searchbar-arrow-button" title="Submit">
          {loading ? <FaSpinner className="spin" size={20} /> : <BsArrowRight size={22} />}
        </button>
      </div>

      <div className="searchbar-messages">
        {platform && (
          <p className="platform-text">
            Detected: {platform === 'YouTube' && <FaYoutube color="red" />}{" "}
            {platform === 'Spotify' && <FaSpotify color="#1DB954" />} {platform}
          </p>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>

      {metadata && (
        <div className="searchbar-result">
          <img src={metadata.thumbnail_url} alt="Thumbnail" className="result-thumbnail" />
          <div className="result-info">
            <p className="result-title">{metadata.title}</p>
          </div>
          
        </div>
        
      )}
      <div className="edit-button-wrapper">
        <button className="edit-button" onClick={onEditClick}>
          <FaCut size={17} className="cut-icon" />
          <span>Cut</span>
        </button>
      </div>

    </div>
  );
}

export default SearchBar;
