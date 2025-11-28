# 🛡️# Shai-Hulud Scan 🐛

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
git clone https://github.com/MChorfa/shai-hulud-scan.git
cd shai-hulud-scan
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

## 🛡️ Dagger-First Pipeline

This project uses a **Dagger-First** workflow for all build and security operations. There are no GitHub Actions; Dagger handles everything.

### 1. Check for Infections

Run the security scan against your local `package-lock.json`:

```bash
dagger call check --source .
```

This will:

1.  Builds the full SQLite database from source CSV.
2.  Parses your `package-lock.json`.
3.  Checks for any compromised packages.

### 2. Build the Site & Database

```bash
dagger call build-site --source .
```

This generates:

*   `out/`: The static site export.
*   `data/shai-hulud.db`: The complete SQLite database.

### 3. Full Pipeline

Run tests, security scan, and build in one go:

```bash
dagger call pipeline --source .
```

1.  **Test**: Runs `npm run lint` (and tests if available).
2.  **Scan**: Checks for compromised packages.
3.  **Build**: Generates the site and database.

### 4. Individual Commands

*   **Test**: `dagger call test` (Linting)
*   **Scan**: `dagger call scan` (Security Check)

### Data Updates

To update the vulnerability database:

1.  Modify the CSV file.
2.  Run `npm run build-db`.

## 🏗️ Architecture & Mechanisms

This project uses a dual-mode architecture to support both full-featured local development and static GitHub Pages deployment.

| Feature           | Local / Docker / API Mode                                                            | GitHub Pages (Static) Mode                                                 |
| :---------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Database**      | **SQLite (better-sqlite3)**<br>Full relational DB with FTS5 & Vector support.        | **JSON (Static)**<br>Pre-built `packages.json` loaded into browser memory. |
| **Search**        | **Hybrid Composite Search**<br>Combines BM25 (Keyword) + Cosine Similarity (Vector). | **Text-Only Search**<br>Client-side filtering of the JSON dataset.         |
| **SBOM Analysis** | **Server-Side**<br>`/api/analyze` parses and checks files against SQLite.            | **Client-Side**<br>Browser parses JSON and checks against static data.     |
| **Deployment**    | Docker Container / Node.js Server                                                    | Static HTML/JS Export (`npm run build`)                                    |

### 🛡️ Security Mechanisms

*   **SQL Injection Protection**: All database queries use **Prepared Statements** with parameter binding.
*   **Input Sanitization**: Search inputs are sanitized to prevent injection attacks.
*   **Privacy**: In static mode, all analysis happens in your browser. No data leaves your machine.

## 🗡️ Dagger Pipeline

We use [Dagger](https://dagger.io) for our CI/CD pipeline, ensuring consistent checks across all environments.

```bash
# Run the full pipeline (Test -> Scan -> Build)
dagger call pipeline

# Run just the security scan on your local package-lock.json
dagger call scan
```

## 🐛 Troubleshooting

### npm error 403 / Authentication Issues

If you see `npm error 403 Forbidden` when running Dagger, it means the container cannot access the npm registry. This is often due to enterprise proxy/registry settings.

**Solution**: Ensure your `.npmrc` is correctly mounted or configured in the Dagger pipeline.

## 🔒 Security Note

This tool analyzes known compromised packages. Always verify results and maintain proper security practices in your supply chain management.

## 🏆 Attribution & Credits

This educational tool is based on groundbreaking security research by the **Wiz Research Team** who discovered and documented the Shai-Hulud 2.0 supply chain attack.

*   **Original Research**: [Shai-Hulud 2.0 Supply Chain Attack](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)
*   **Researchers**: Hila Ramati, Merav Bar, Gal Benmocha, Gili Tikochinski (Wiz Research)
*   **Additional Analysis**: [Aikido Security Blog](https://www.aikido.dev/blog/shai-hulud-strikes-again-hitting-zapier-ensdomains)

## ⚠️ Disclaimer

**This is an educational tool created for awareness purposes only.**

*   All vulnerability data and attack patterns are based on public research findings.
*   For production security monitoring and protection, please use official tools from [Wiz](https://www.wiz.io) and [Aikido](https://www.aikido.dev).
*   The maintainers of this project are not affiliated with the original researchers.

---

*"The spice must flow."* - Shai-Hulud
