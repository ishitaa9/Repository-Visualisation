import github from '../assets/github.png';
import laptop from '../assets/laptop.svg';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function NavBar() {
  const { t } = useTranslation();

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <img src={laptop} className="nav-img" alt="laptop icon"/>
          <Link to="/" className="brand-name">RepoViz</Link>
        </div>

        <nav className="nav-links">
          <a href="#">{t("nav.imprint")}</a>
          <div className='nav-link-container'>
            <img src={github} alt='GitHub logo' className='github-logo'/>
            <a href="https://github.com/ishitaa9/Repository-Visualisation" rel="noopener noreferrer" target='_blank'>
              {t("nav.github")}
            </a>
          </div>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
