import Hero from './Hero.jsx'
import SearchBar from './SearchBar.jsx'
import './App.css'

function App() {
  
  const handleLinkSubmit = (link) => {
    console.log("User pasted:", link);
    // future: send to API or backend
  };

  return (
    <>
      <Hero/>
      <SearchBar onSubmit={handleLinkSubmit} />  
    </>
  )
}

export default App
