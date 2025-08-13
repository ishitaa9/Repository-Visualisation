import React from "react";

export default function NavBar() {

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <span className="brand-left">Repo</span>
          <span className="brand-right">Viz</span>
        </div>

        <nav className="nav-links">
          <a href="#">API Key</a>
          <a href="#">Privare Repository</a>
          <a href="#">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
