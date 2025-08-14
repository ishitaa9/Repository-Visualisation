import github from '../assets/github.png'
import laptop from '../assets/laptop.svg'
import { Link } from 'react-router-dom'

export default function NavBar() {

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <img src={laptop} className="nav-img" alt="laptop icon"/>
          <Link to="/" className="brand-name">RepoViz</Link>
        </div>

        <nav className="nav-links">
          <a href="#">API Key</a>
          <a href="#">Private Repository</a>
          <div className='nav-link-container'>
          <img src={github} alt='GitHub logo' className='github-logo'/>
          <a href="https://github.com/ishitaa9/Repository-Visualisation" rel="noopener noreferrer" target='_blank'>GitHub</a>
          </div>
        </nav>
      </div>
    </header>
  );
}

// <button type="button" className="linklike" aria-haspopup="dialog">API Key</button>
// <button type="button" className="linklike">Private Repository</button>
// <a href="https://github.com/ishitaa9/Repository-Visualisation" target="_blank" rel="noopener noreferrer">GitHub</a>