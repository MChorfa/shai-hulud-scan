# GitHub Pages Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- GitHub repository created
- Node.js 18+ installed locally

### Step 1: Export Database
```bash
npm run export-db
```
This exports the SQLite database to `public/data/packages.json` for static hosting.

### Step 2: Build for Production
```bash
npm run build
```
Creates optimized static files in the `out/` directory.

### Step 3: Deploy to GitHub Pages
```bash
npm run deploy
```
Commits and pushes the built files to GitHub.

### Manual Deploy (Alternative)
```bash
# Export database and build
npm run export

# Add GitHub Pages deployment
git add out/
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix out origin gh-pages
```

## 📁 File Structure

```
shai-hulud-education/
├── public/
│   └── data/
│       ├── packages.json    # Static database (795 packages)
│       └── stats.json       # Package statistics
├── out/                     # Built static site
├── .github/workflows/
│   └── deploy.yml          # Auto-deploy workflow
└── src/
    ├── lib/
    │   └── static-db.ts    # Static database loader
    └── app/
        └── page.tsx        # Main UI (GitHub Pages compatible)
```

## 🔧 Configuration

### GitHub Pages Settings
1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages`
4. Folder: `/ (root)`

### Base Path Configuration
The app is configured to work from:
- **Development**: `http://localhost:3000`
- **GitHub Pages**: `https://username.github.io/shai-hulud-security/`

## 🎯 Features Available on GitHub Pages

### ✅ Working Features
- **Package Search** - Text-based search across 795 packages
- **Threat Statistics** - Risk level distribution dashboard
- **Package Analysis** - SBOM upload and analysis (simulated)
- **Responsive Design** - Mobile-friendly interface

### ⚠️ Limited Features (GitHub Pages)
- **Semantic Search** - Uses text search instead of vector embeddings
- **Real-time API** - Static data instead of live database queries
- **Performance Monitoring** - Disabled in static mode

### 🔄 Development vs Production

| Feature     | Development          | GitHub Pages     |
| ----------- | -------------------- | ---------------- |
| Database    | SQLite + Drizzle ORM | Static JSON file |
| Search      | Text + Semantic      | Text only        |
| APIs        | Full REST API        | Static data      |
| Performance | Real-time monitoring | Basic metrics    |

## 🌐 Deployment URL

After deployment, your app will be available at:
```
https://[your-username].github.io/shai-hulud-security/
```

## 📊 Performance

### Static Site Benefits
- **Fast loading** - Pre-built HTML/CSS/JS
- **CDN friendly** - Served via GitHub Pages CDN
- **No server costs** - Free hosting on GitHub
- **High availability** - GitHub's infrastructure

### Bundle Size
- **Total size**: ~2MB (including database)
- **Database**: 795 packages (~500KB)
- **Assets**: Optimized images and fonts
- **JavaScript**: Minified and tree-shaken

## 🔒 Security Considerations

### GitHub Pages Security
- **No server-side code** - Reduced attack surface
- **Static content only** - No database connections
- **HTTPS enforced** - Automatic SSL certificate
- **CORS protected** - GitHub Pages security headers

### Data Privacy
- **No user data collection** - Client-side only
- **No API keys** - All processing local
- **Open source** - Transparent code base

## 🐛 Troubleshooting

### Common Issues

**404 Errors on GitHub Pages**
- Check `basePath` in `next.config.js`
- Verify repository name matches config
- Ensure files are in `gh-pages` branch

**Search Not Working**
- Verify `packages.json` exists in `public/data/`
- Check browser console for errors
- Ensure static database loader is working

**Styles Not Loading**
- Check `assetPrefix` configuration
- Verify Tailwind CSS build
- Clear browser cache

### Debug Mode
Add `?debug=true` to URL for additional logging:
```
https://username.github.io/shai-hulud-security/?debug=true
```

## 📈 Analytics

### GitHub Pages Analytics
- Built-in traffic analytics
- Page view tracking
- Referrer information

### Custom Analytics (Optional)
Add Google Analytics or similar to `_app.tsx`:
```tsx
export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {process.env.NODE_ENV === 'production' && (
        <>
          <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"/>
          <script dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_ID');`
          }} />
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
```

---

## 🎉 Success!

Your Shai-Hulud 2.0 security analysis tool is now live on GitHub Pages with:
- ✅ 795 compromised packages indexed
- ✅ Fast text search functionality  
- ✅ Real-time threat statistics
- ✅ Responsive mobile design
- ✅ Zero hosting costs
- ✅ Professional attribution and licensing

*"The spice must flow."* - Shai-Hulud
