import React from "react";
import "./App.css";
import StakeViewer from "./components/StakeViewer";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <StakeViewer />
      </div>
      <Footer />
    </div>
  );
}

export default App;
