"use client";

import React from "react";
import Navigation from "@/components/Navigation";
import { Terminal, Server, Code, Cpu, Globe, Box } from "lucide-react";

export default function Developers() {
  return (
    <div className="min-h-screen bg-black text-red-50 selection:bg-red-900 selection:text-white relative overflow-hidden crt">
      <Navigation />

      {/* CRT Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/10 to-transparent animate-pulse"></div>
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="h-px bg-green-900/20 animate-pulse"></div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-6 relative z-10">
        <header className="mb-12 border-b border-red-900/50 pb-8">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-4 flex items-center gap-4">
            <Terminal className="w-12 h-12 text-red-500" />
            <span className="glitch" data-text="DEVELOPER ACCESS">
              DEVELOPER ACCESS
            </span>
          </h1>
          <p className="text-xl text-blue-400 font-mono">
            Technical Documentation & API Reference
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: API & CLI */}
          <div className="lg:col-span-8 space-y-12">
            {/* Architecture Section */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4">
                <Globe className="w-6 h-6 text-blue-500" />
                Dual-Mode Architecture
              </h2>
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Shai-Hulud Scan is designed to run in two distinct modes,
                  adapting to the deployment environment while maintaining core
                  detection functionality across both Shai-Hulud 2.0 and Mini
                  Shai-Hulud campaigns.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/50 border border-blue-900/50 p-4">
                    <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Dynamic Mode (Docker/Local)
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-400 font-mono">
                      <li>• Backend: Next.js API Routes</li>
                      <li>• Database: SQLite (better-sqlite3)</li>
                      <li>• Search: Hybrid (BM25 + Vector)</li>
                      <li>• Analysis: Server-side streaming</li>
                    </ul>
                  </div>

                  <div className="bg-black/50 border border-green-900/50 p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Static Mode (GitHub Pages)
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-400 font-mono">
                      <li>• Backend: None (Client-side only)</li>
                      <li>• Database: Pre-built JSON export</li>
                      <li>• Search: Client-side text filter</li>
                      <li>• Analysis: In-browser processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-purple-500 pl-4">
                <Code className="w-6 h-6 text-purple-500" />
                API Reference
              </h2>

              <div className="space-y-6">
                {/* Endpoint 1 */}
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm overflow-hidden">
                  <div className="bg-gray-900/50 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-green-900/50 text-green-400 px-2 py-1 text-xs font-bold border border-green-900">
                        GET
                      </span>
                      <code className="text-sm text-white">
                        /api/search/composite
                      </code>
                    </div>
                    <span className="text-xs text-gray-500">Hybrid Search</span>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-400 mb-4">
                      Performs a hybrid search combining BM25 keyword matching
                      with vector-based semantic similarity.
                    </p>
                    <div className="bg-black border border-gray-800 p-4 rounded font-mono text-xs text-gray-300 overflow-x-auto">
                      curl
                      &quot;http://localhost:3000/api/search/composite?q=react&limit=5&quot;
                    </div>
                  </div>
                </div>

                {/* Endpoint 2 */}
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-sm overflow-hidden">
                  <div className="bg-gray-900/50 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-900/50 text-blue-400 px-2 py-1 text-xs font-bold border border-blue-900">
                        POST
                      </span>
                      <code className="text-sm text-white">/api/analyze</code>
                    </div>
                    <span className="text-xs text-gray-500">SBOM Analysis</span>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-400 mb-4">
                      Analyzes a package-lock.json file against the Shai-Hulud
                      database.
                    </p>
                    <div className="bg-black border border-gray-800 p-4 rounded font-mono text-xs text-gray-300 overflow-x-auto">
                      curl -X POST -F &quot;file=@package-lock.json&quot;
                      http://localhost:3000/api/analyze
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CLI Tools */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-orange-500 pl-4">
                <Terminal className="w-6 h-6 text-orange-500" />
                CLI Tools
              </h2>
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
                <p className="text-gray-300 mb-4">
                  The project includes powerful CLI scripts for local analysis
                  and database management.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-bold mb-2 text-sm">
                      Check package-lock.json
                    </h4>
                    <div className="bg-black border border-gray-800 p-3 rounded font-mono text-xs text-green-400">
                      npx tsx scripts/check-sqlite.ts ./package-lock.json
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2 text-sm">
                      Rebuild Database
                    </h4>
                    <div className="bg-black border border-gray-800 p-3 rounded font-mono text-xs text-green-400">
                      npm run build-db
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Dagger & Tech Stack */}
          <div className="lg:col-span-4 space-y-8">
            {/* Dagger Pipeline */}
            <section className="bg-[#0a0a0a] border border-red-900/30 p-6 rounded-sm relative overflow-hidden group hover:border-red-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl font-bold text-red-700 pointer-events-none">
                CI/CD
              </div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-red-500" />
                Dagger Pipeline
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                We use Dagger to define our CI/CD pipeline as code, ensuring
                reproducibility across local and remote environments.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-black/50 p-3 border border-gray-800">
                  <span className="text-gray-500"># Run full pipeline</span>
                  <br />
                  <span className="text-white">dagger call deploy</span>
                </div>
                <div className="bg-black/50 p-3 border border-gray-800">
                  <span className="text-gray-500"># Scan local project</span>
                  <br />
                  <span className="text-white">dagger call scan</span>
                </div>
                <div className="bg-black/50 p-3 border border-gray-800">
                  <span className="text-gray-500"># Run tests</span>
                  <br />
                  <span className="text-white">dagger call test</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <a
                  href="https://dagger.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  Learn more about Dagger <span className="text-lg">→</span>
                </a>
              </div>
            </section>

            {/* Tech Stack */}
            <section className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                Tech Stack
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Framework</span>
                  <span className="text-white font-mono text-sm">
                    Next.js 16
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Database</span>
                  <span className="text-white font-mono text-sm">
                    SQLite + Vector
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Styling</span>
                  <span className="text-white font-mono text-sm">
                    Tailwind CSS
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400 text-sm">Pipeline</span>
                  <span className="text-white font-mono text-sm">
                    Dagger (Go)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-gray-400 text-sm">AI Model</span>
                  <span className="text-white font-mono text-sm">
                    Xenova/all-MiniLM
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
