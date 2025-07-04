import { useState } from 'react';
import { BsArrowRight } from 'react-icons/bs';
import { FaSpinner, FaSpotify, FaYoutube } from 'react-icons/fa';
import { RxCross2 } from 'react-icons/rx'; // using RxCross2 for clear icon

function SearchBar({ onSubmit }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = () => {
    if (!link.trim()) {
      setError('Link cannot be empty.');
      setPlatform('');
      return;
    }

    const isValid = validateLink(link);
    if (!isValid) {
      setError('Please enter a valid YouTube or Spotify link.');
      setPlatform('');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      onSubmit(link);
      setLoading(false);
      setLink('');
      setPlatform('');
    }, 1500);
  };

  const handleClear = () => {
    setLink('');
    setError('');
    setPlatform('');
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
    </div>
  );
}

export default SearchBar;
