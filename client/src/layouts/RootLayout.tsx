import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function RootLayout() {
  return (
    <>
      <NavBar />
      <main className="main">
      <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-line">
          <svg className="sparkle-footer " viewBox="0 0 64 64" aria-hidden>
            <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
          </svg>
          <p style={{fontSize:"15px"}}>Inspired by:
            <a href="https://gitingest.com/" rel="noreferrer" style={{paddingLeft:"4px"}}>Gitingest.com</a>
          </p>
          <svg className="sparkle-footer " viewBox="0 0 64 64" aria-hidden>
            <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
          </svg>
        </div>

        <div className="container footer-line">
          <svg className="sparkle-footer " viewBox="0 0 64 64" aria-hidden>
            <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
          </svg>
          <p style={{fontSize:"15px"}}>Made by
            <a href="#" rel="noreferrer" style={{paddingLeft:"4px"}}>Ishita Gupta</a>
          </p>
          <svg className="sparkle-footer " viewBox="0 0 64 64" aria-hidden>
            <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
          </svg>
        </div>
      </footer>
    </>
  );
}
