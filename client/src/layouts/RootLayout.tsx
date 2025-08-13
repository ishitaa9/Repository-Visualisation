import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function RootLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
      <footer className="footer">
        <div className="container">
          <p>Made by <a href="#" rel="noreferrer">Ishita Gupta</a></p>
        </div>
      </footer>
    </>
  );
}
