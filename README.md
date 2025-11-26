# 🛡️ Shai-Hulud 2.0 Security Analysis Tool

> **Educational visualization and analysis tool for the Shai-Hulud 2.0 npm supply chain attack**

## 📖 Original Research & Attribution

**This tool is based on the groundbreaking security research by:**

### 🔬 **Wiz Research Team**
- **Hila Ramati** - Security Researcher
- **Merav Bar** - Security Researcher  
- **Gal Benmocha** - Security Researcher
- **Gili Tikochinski** - Security Researcher

**Original Research Publication:** November 24, 2025  
**Research Organization:** [Wiz](https://www.wiz.io/)  
**Original Article:** [Shai-Hulud 2.0 Supply Chain Attack: 25K+ Repos Exposing Secrets](https://www.wiz.io/blog/shai-hulud-2-supply-chain-attack)

---

## 🎯 Educational Purpose

This tool was created **exclusively for educational and awareness purposes** to help the security community understand the scope and impact of the Shai-Hulud 2.0 supply chain attack.

**⚠️ Important:** This is an educational tool. For production security monitoring, use the official [Wiz Threat Intel Center](https://www.wiz.io/threat-intel-center).

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/your-username/shai-hulud-security.git
cd shai-hulud-security
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production
```bash
npm run build
npm start
```

## 📊 Database Schema

- **795 compromised packages** from Shai-Hulud 2.0 attack
- **Risk distribution**: 22% Critical, 39% High, 30% Medium, 10% Low
- **Vector embeddings**: 384-dimensional semantic vectors for all packages
- **FTS indexing**: Full-text search with SQLite FTS5

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Search**: Full-text + Semantic vector search
- **Embeddings**: Local sentence-transformers (no API keys required)
- **Styling**: Tailwind CSS, Lucide Icons
- **Performance**: Better-sqlite3, WAL mode, 64MB cache

## 📡 API Endpoints

### Search & Analysis
- `POST /api/analyze` - SBOM package analysis
- `GET /api/packages` - Package search and statistics
- `POST /api/search/composite` - Hybrid text + semantic search
- `POST /api/search/semantic` - Pure semantic search

### Management
- `GET /api/performance` - Performance metrics
- `GET /api/database` - Database statistics
- `POST /api/database?action=optimize` - Database optimization

### Embeddings
- `POST /api/embeddings/generate` - Generate package embeddings

## 🏆 Performance Metrics

- **Query time**: <100ms average
- **Database size**: 565KB (optimized)
- **Cache hit rate**: 85%+ for common searches
- **Embedding generation**: 50 packages/second

## 🤝 Attribution & Credits

### Original Research
This tool is based on the **Shai-Hulud 2.0** supply chain security research. Original vulnerability discovery and analysis credited to the cybersecurity community.

### Core Technologies
- **[Next.js](https://nextjs.org/)** - React framework
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database access
- **[SQLite](https://sqlite.org/)** - Embedded database engine
- **[Sentence Transformers](https://www.sbert.net/)** - Semantic embeddings
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful icon library

### Security Data
Package vulnerability data sourced from the Shai-Hulud 2.0 research dataset, containing 795 confirmed compromised npm packages with associated risk assessments.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🐛 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security Note

This tool analyzes known compromised packages. Always verify results and maintain proper security practices in your supply chain management.

---

*"The spice must flow."* - Shai-Hulud
