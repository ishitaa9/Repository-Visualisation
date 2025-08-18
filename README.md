# 📊 Repository Visualizer
An interactive tool to analyze and visualize GitHub repositories. 
It generates a dependency graph of files, provides insights into project structure, 
and highlights analytics such as license, dependencies, test coverage, and more.

Built with React, TypeScript, Cytoscape.js, Express, and Vite


## 🔗 Live Demo
👉 [Try it here](https://repository-visualisation.vercel.app)  

![demo gif](docs/demo.gif)  


## ✨ Features
- 🔍 **Repository Analysis**: parse source files, detect imports/exports, compute dependency graph  
- 🌐 **Interactive Graph**: zoom, search, filter, multiple layouts, export to PNG  
- 📊 **Analytics**: license detection, dependency stats, test framework detection  
- 🌍 **Multi-language support** via i18next  


## 🚀 Tech Stack
- **Frontend** → React 19, Vite, TypeScript, Cytoscape.js  
- **Backend** → Express, Node.js, Babel parser, TypeScript  
- **Deployment** → Vercel (frontend) + Render (backend)  


## 📦 Installation

Clone the repo:

```bash
git clone https://github.com/your-username/repo-visualizer.git
cd repo-visualizer
```

Backend (server)
```bash
cd server
npm install
npm run build
npm start
```

Server will run at http://localhost:4000

Frontend (client)
```bash
cd client
npm install
npm run dev
```

App will be available at http://localhost:5173


## 🔮 Roadmap

- Optimize analysis speed with caching by commit hash
- Add support for more languages (Java, Go, Rust)
- Expand analytics: code metrics, test coverage
- Dark mode for graph visualization


 ## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open a PR or file an issue.
