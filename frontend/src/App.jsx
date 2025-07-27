import { useRef, useState } from 'react'
import Hero from './Hero.jsx'
import SearchBar from './SearchBar.jsx'
import EditSection from './EditSection.jsx'
import './App.css'

function App() {
  const editRef = useRef(null);
  const [showEdit, setShowEdit] = useState(false); // 👈 new state

  const scrollToEdit = () => {
    setShowEdit(true); // 👈 show the EditSection
    setTimeout(() => {
      editRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // small delay ensures visibility before scroll
  };

  const handleLinkSubmit = (link) => {
    console.log("User pasted:", link);
    // future: send to API or backend
  };

  return (
    <>
      <Hero />
      <SearchBar onSubmit={handleLinkSubmit} onEditClick={scrollToEdit} />
      {showEdit && ( // 👈 only show EditSection if Cut was clicked
        <div ref={editRef}>
          <EditSection />
        </div>
      )}
    </>
  )
}

export default App
