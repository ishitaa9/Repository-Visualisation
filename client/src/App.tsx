import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Hero from "./components/Hero";
import DiagramPage from "./pages/DiagramPage";
import "./styles.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<RootLayout />}>
          <Route
            path="/"
            element={
              <Hero />
            }
          />
          <Route path="/diagram" element={<DiagramPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
