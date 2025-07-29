// App.jsx
import { useRef, useState } from 'react'
import Hero from './Hero.jsx'
import SearchBar from './SearchBar.jsx'
import EditSection from './EditSection.jsx'
import './App.css'

function App() {
  const editRef = useRef(null);
  const [showEdit, setShowEdit] = useState(false);
  const [videoLinkToEdit, setVideoLinkToEdit] = useState(null); // 👈 new state

  const scrollToEdit = (link) => {
    setVideoLinkToEdit(link); // 👈 set link to be passed to EditSection
    setShowEdit(true);
    setTimeout(() => {
      editRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLinkSubmit = (link) => {
    console.log("User pasted:", link);
    // optional: store submitted link separately
  };

  return (
    <>
      <Hero />
      <SearchBar onSubmit={handleLinkSubmit} onEditClick={scrollToEdit} />
      {showEdit && (
        <div ref={editRef}>
          <EditSection videoLink={videoLinkToEdit} /> {/* 👈 pass link */}
        </div>
      )}
    </>
  );
}

export default App
