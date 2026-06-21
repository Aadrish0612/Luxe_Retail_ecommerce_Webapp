import React from 'react';
import AutoSuggestion from './components/AutoSuggestion';
import "./App.css";

const App = () => {
  return (
    <>
      {/* Ambient background glows for the liquid glass effect */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      
      <div className="app-container">
        <AutoSuggestion />
      </div>
    </>
  );
};

export default App;