import github from '../assets/github.png'
import laptop from '../assets/laptop.svg'
export default function NavBar() {

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <img src={laptop} className="nav-img" alt="laptop icon"/>
          <a href="./" className="brand-name">RepoViz</a>
        </div>

        <nav className="nav-links">
          <a href="#">API Key</a>
          <a href="#">Private Repository</a>
          <div className='nav-link-container'>
          <img src={github} alt='GitHub logo' className='github-logo'/>
          <a href="https://github.com/ishitaa9/Repository-Visualisation" target='_blank'>GitHub</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
