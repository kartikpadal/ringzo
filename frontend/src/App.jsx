import {useRef } from 'react'
import Hero from './Hero.jsx'
import SearchBar from './SearchBar.jsx'
import './App.css'

function App() {

   const editRef = useRef(null);

  const scrollToEdit = () => {
    editRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleLinkSubmit = (link) => {
    console.log("User pasted:", link);
    // future: send to API or backend
  };

  return (
    <>
      <Hero/>
      <SearchBar onSubmit={handleLinkSubmit}  onEditClick={scrollToEdit}/> 
      <div ref={editRef}>
        <EditSection />
      </div> 
    </>
  )
}

export default App

