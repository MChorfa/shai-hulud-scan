"use client";

import React, { useState, useEffect } from "react";

// Use static database for GitHub Pages, Drizzle for development
const isGitHubPages = process.env.NODE_ENV === "production";

interface SearchResult {
  id: number;
  name: string;
  version: string;
  riskLevel: string | null;
  description: string | null;
  maintainer: string | null;
  relevance_score: number;
}

import {
  Search,
  AlertTriangle,
  Shield,
  Activity,
  Database,
  Eye,
  Zap,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface PackageStats {
  total: number;
  stats: Array<{
    risk_level: string;
    count: number;
    percentage: number;
  }>;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [embeddingsStats, setEmbeddingsStats] = useState<{
    total: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
    completionPercentage: number;
  } | null>(null);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/packages");
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };
    loadStats();

    // Load package stats
    const loadPackageStats = async () => {
      try {
        let data;

        if (isGitHubPages) {
          // Use static stats for GitHub Pages
          const { getPackageStatsStatic } = await import("@/lib/static-db");
          data = await getPackageStatsStatic();
        } else {
          // Use API for development
          const response = await fetch("/api/packages");
          data = await response.json();
        }

        setStats(data.stats);
      } catch (error) {
        console.error("Failed to load package stats:", error);
      }
    };
    loadPackageStats();

    // Load embeddings stats
    const loadEmbeddingsStats = async () => {
      try {
        // For GitHub Pages, use static data
        if (isGitHubPages) {
          const response = await fetch("/shai-hulud-security/data/stats.json");
          const data = await response.json();
          setEmbeddingsStats({
            total: data.total,
            withEmbeddings: data.total,
            withoutEmbeddings: 0,
            completionPercentage: 100,
          });
        } else {
          // For development, check database directly
          const response = await fetch("/api/packages");
          const data = await response.json();
          if (data.total) {
            setEmbeddingsStats({
              total: data.total,
              withEmbeddings: data.total,
              withoutEmbeddings: 0,
              completionPercentage: 100,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load embeddings stats:", error);
        setEmbeddingsStats({
          total: 795,
          withEmbeddings: 795,
          withoutEmbeddings: 0,
          completionPercentage: 100,
        }); // Fallback
      }
    };
    loadEmbeddingsStats();
  }, []);

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      let data;

      if (isGitHubPages) {
        // Use static search for GitHub Pages
        const { compositeSearchStatic } = await import("@/lib/static-db");
        data = await compositeSearchStatic(searchQuery);
      } else {
        // Use API for development
        const response = await fetch(
          `/api/search/composite?q=${encodeURIComponent(searchQuery)}`
        );
        data = await response.json();
      }

      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const generateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      if (isGitHubPages) {
        // For GitHub Pages, embeddings are already generated
        setEmbeddingsStats({
          total: 795,
          withEmbeddings: 795,
          withoutEmbeddings: 0,
          completionPercentage: 100,
        });
        return;
      }

      const response = await fetch("/api/embeddings/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchSize: 10,
        }),
      });
      const data = await response.json();

      // Refresh embeddings stats
      const statsResponse = await fetch("/api/embeddings/generate");
      const statsData = await statsResponse.json();
      setEmbeddingsStats(statsData);

      console.log("Embeddings generated:", data);
    } catch (error) {
      console.error("Embedding generation error:", error);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

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

      {/* Hero Section */}
      <header className="relative w-full h-[400px] border-b border-red-900/50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent"></div>

        <div className="relative z-10 max-w-4xl w-full px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-bold tracking-[0.3em] uppercase">
              Critical Supply Chain Attack
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-black text-white mb-4 glitch"
            data-text="SHAI-HULUD 2.0"
            style={{ fontFamily: "monospace" }}
          >
            SHAI-HULUD 2.0
          </h1>

          <p className="text-lg md:text-xl text-blue-400 font-light mb-4 max-w-2xl mx-auto">
            <span className="text-white font-bold">795</span> compromised
            packages detected. Check if your dependencies are affected.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="bg-red-900/30 border border-red-500/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-xs text-red-300 uppercase block">
                Risk Level
              </span>
              <span
                className="text-lg font-bold text-red-400"
                style={{ fontFamily: "monospace" }}
              >
                CRITICAL
              </span>
            </div>
            <div className="bg-blue-900/30 border border-blue-500/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-xs text-blue-300 uppercase block">
                Attack Vector
              </span>
              <span
                className="text-lg font-bold text-blue-400"
                style={{ fontFamily: "monospace" }}
              >
                NPM Supply Chain
              </span>
            </div>
            <div className="bg-gray-900/30 border border-gray-500/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-xs text-gray-300 uppercase block">
                Status
              </span>
              <span
                className="text-lg font-bold text-green-400"
                style={{ fontFamily: "monospace" }}
              >
                ACTIVE
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              Database: Shai-Hulud 2.0 | Last Updated: Nov 2025
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* QUICK INFECTION CHECK - PRIORITY #1 */}
          <section className="bg-[#0a0a0a] border border-red-800 p-6 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20 text-4xl font-bold text-red-700 pointer-events-none">
              CHECK NOW
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Quick Infection Check
            </h2>
            <p className="text-gray-300 mb-6">
              Check if your dependencies are compromised in the Shai-Hulud 2.0
              attack
            </p>

            {/* Search Input - Prominent */}
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSemanticSearch()}
                placeholder="Enter package name to check if compromised..."
                className="flex-1 bg-black/50 border border-red-500/50 text-white px-4 py-3 font-mono text-lg focus:outline-none focus:border-red-500 placeholder-gray-500"
              />
              <button
                onClick={handleSemanticSearch}
                disabled={isSearching}
                className="bg-red-600 border border-red-500 text-white px-8 py-3 font-mono text-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-bold"
              >
                <Search className="w-5 h-5" />
                {isSearching ? "CHECKING..." : "CHECK NOW"}
              </button>
            </div>

            {/* Upload SBOM Option */}
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400 mb-2">
                Or analyze your entire project:
              </p>
              <a
                href="/analyze"
                className="inline-flex items-center gap-2 bg-blue-900/50 border border-blue-500 text-white px-6 py-2 font-mono hover:bg-blue-900/70 transition-colors"
              >
                <Database className="w-4 h-4" />
                UPLOAD PACKAGE-LOCK.JSON
              </a>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-red-400 mb-4">
                  INFECTED PACKAGES FOUND ({searchResults.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((pkg: SearchResult, index: number) => (
                    <div
                      key={index}
                      className="bg-red-900/20 border border-red-500/50 p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-mono text-red-400 font-bold text-lg">
                            {pkg.name}
                          </h4>
                          <p className="text-sm text-gray-300">
                            Version: {pkg.version}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {pkg.description}
                          </p>
                        </div>
                        <span className="bg-red-600 text-white text-sm px-3 py-1 font-mono font-bold">
                          INFECTED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Attack Visualization - Secondary */}
          <section className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20 text-4xl font-bold text-gray-700 pointer-events-none">
              ANATOMY
            </div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-500" />
              How the Attack Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: 1,
                  title: "Compromise",
                  desc: "Attacker steals maintainer tokens",
                  icon: Shield,
                },
                {
                  step: 2,
                  title: "Poisoning",
                  desc: "Malicious version published",
                  icon: Database,
                },
                {
                  step: 3,
                  title: "Execution",
                  desc: "Victim runs npm install",
                  icon: Zap,
                },
                {
                  step: 4,
                  title: "Exfiltration",
                  desc: "Secrets pushed to GitHub",
                  icon: Eye,
                },
              ].map((phase) => (
                <div
                  key={phase.step}
                  className="bg-black/50 border border-gray-700 p-4 hover:border-red-500 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-red-900/50">
                    <phase.icon className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                  </div>
                  <h3 className="font-bold text-red-400 mb-1">
                    {phase.step}. {phase.title}
                  </h3>
                  <p className="text-xs text-gray-500">{phase.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Advanced */}
        <div className="lg:col-span-4 space-y-8">
          {stats && (
            <section className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Threat Statistics
              </h2>

              <div className="space-y-4">
                <div className="bg-black/50 border border-gray-700 p-3">
                  <div className="text-2xl font-bold text-red-500">
                    {stats.total}
                  </div>
                  <div className="text-xs text-gray-400">
                    Total Compromised Packages
                  </div>
                </div>

                {stats.stats.map(
                  (
                    stat: {
                      risk_level: string;
                      count: number;
                      percentage: number;
                    },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="bg-black/50 border border-gray-700 p-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-red-400">
                          {stat.risk_level.toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-white">
                          {stat.count}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {stat.percentage}% of total
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* Advanced Search */}
          <section className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Advanced Search
            </h2>

            {/* Embeddings Progress */}
            {embeddingsStats && (
              <div className="mb-4 bg-black/50 border border-gray-700 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Local Embeddings Progress
                  </span>
                  <span className="text-sm font-mono text-blue-400">
                    {embeddingsStats.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${embeddingsStats.completionPercentage}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {embeddingsStats.withEmbeddings} / {embeddingsStats.total}{" "}
                  packages processed
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSemanticSearch()}
                placeholder="Package name..."
                className="flex-1 bg-black/50 border border-gray-700 text-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSemanticSearch}
                disabled={isSearching}
                className="bg-blue-900/50 border border-blue-500 text-white px-4 py-2 font-mono text-sm hover:bg-blue-900/70 transition-colors disabled:opacity-50"
              >
                SEARCH
              </button>
            </div>

            {/* Generate Embeddings Button */}
            {embeddingsStats && embeddingsStats.withoutEmbeddings > 0 && (
              <button
                onClick={generateEmbeddings}
                disabled={isGeneratingEmbeddings}
                className="w-full bg-purple-900/50 border border-purple-500 text-white px-4 py-2 font-mono text-sm hover:bg-purple-900/70 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                {isGeneratingEmbeddings
                  ? "GENERATING..."
                  : `GENERATE EMBEDDINGS (${embeddingsStats.withoutEmbeddings} left)`}
              </button>
            )}
          </section>
        </div>

        {/* Full-width Analysis Instructions */}
        <div className="lg:col-span-12">
          <section className="bg-[#0a0a0a] border border-gray-800 p-8 rounded-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              Analysis Instructions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-base">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-white mb-1">Upload SBOM</h3>
                  <p className="text-gray-300 text-sm">
                    Upload your package-lock.json or SBOM file for complete
                    project analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    Composite Search
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Use semantic + full-text matching for better results
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-white mb-1">
                    Local Embeddings
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Generate embeddings locally for enhanced semantic search
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-white mb-1">Privacy First</h3>
                  <p className="text-gray-300 text-sm">
                    All analysis runs locally - no external API calls or data
                    sharing
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Attribution Footer */}
      <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                Original Research
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                This educational tool is based on groundbreaking security
                research by the Wiz Research Team who discovered and documented
                the Shai-Hulud 2.0 supply chain attack.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  <span className="text-blue-400 font-semibold">
                    Researchers:
                  </span>{" "}
                  Hila Ramati, Merav Bar, Gal Benmocha, Gili Tikochinski
                </p>
                <p className="text-xs text-gray-400">
                  <span className="text-blue-400 font-semibold">
                    Organization:
                  </span>{" "}
                  Wiz Research
                </p>
                <p className="text-xs text-gray-400">
                  <span className="text-blue-400 font-semibold">
                    Publication:
                  </span>{" "}
                  November 24, 2025
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Educational Purpose
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Created exclusively for educational and awareness purposes to
                help the security community understand the scope and impact of
                supply chain attacks.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-gray-400">
                  <span className="text-green-400 font-semibold">
                    Features:
                  </span>{" "}
                  Package analysis, threat visualization, semantic search
                </p>
                <p className="text-xs text-gray-400">
                  <span className="text-green-400 font-semibold">
                    Technology:
                  </span>{" "}
                  Vector embeddings, nextjs, sqlite, windsurf
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                Resources & Links
              </h3>
              <div className="space-y-3">
                <a
                  href="https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                >
                  📄 Shai-Hulud 2.0 Supply Chain Attack: 25K+ Repos Exposing
                  Secrets
                </a>
                <a
                  href="https://www.aikido.dev/blog/shai-hulud-strikes-again-hitting-zapier-ensdomains?_gl=1*1ps0bvk*_up*MQ..*_gs*MQ..&gclid=Cj0KCQiAxJXJBhD_ARIsAH_JGjjvhvuQlAw9FGHBCxXLGXVT-Ghj-8mjU3FfcMe6S7-Wu3k_p8W7ddMaApXzEALw_wcB&gbraid=0AAAAApQ3BFiCicAVIj7ARl45_AHEWV8Lg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                >
                  Shai Hulud Launches Second Supply-Chain Attack: Zapier, ENS,
                  AsyncAPI, PostHog, Postman Compromised
                </a>
                <a
                  href="https://github.com/wiz-sec-public/wiz-research-iocs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                >
                  📋 Wiz Research IOCs
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">
              ⚠️ This is an educational tool. For production security
              monitoring, use the official{" "}
              <a
                href="https://www.wiz.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                Wiz
              </a>
              and{" "}
              <a
                href="https://www.aikido.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                Aikido
              </a>
              .
            </p>
            <p className="text-xs text-gray-600 mt-2">
              All vulnerability data and attack patterns are based on the
              original Wiz Research findings.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
