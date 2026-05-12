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
  campaign?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<
    "all" | "shai-hulud-2" | "mini-shai-hulud"
  >("all");
  const [activeAttackTab, setActiveAttackTab] = useState<
    "shai-hulud-2" | "mini-shai-hulud"
  >("shai-hulud-2");

  // ... (inside handleSemanticSearch)
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      let data;

      if (isGitHubPages) {
        // Use static search for GitHub Pages
        const { compositeSearchStatic } = await import("@/lib/static-db");
        data = await compositeSearchStatic(searchQuery);
      } else {
        // Use API for development
        const response = await fetch(
          `/api/search/composite?q=${encodeURIComponent(searchQuery)}`,
        );
        data = await response.json();
      }

      if (!data || !data.results) {
        throw new Error("Invalid response format");
      }

      setSearchResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to perform search. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ... (inside JSX, above Results)
  const [embeddingsStats, setEmbeddingsStats] = useState<{
    total: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
    completionPercentage: number;
  } | null>(null);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  useEffect(() => {
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

        if (data && data.stats) {
          setStats(data);
        }
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
          const response = await fetch("/shai-hulud-scan/data/stats.json");
          const data = await response.json();
          setEmbeddingsStats({
            total: data.total,
            withEmbeddings: data.total,
            withoutEmbeddings: 0,
            completionPercentage: 100,
          });
        } else {
          // For development, check database directly
          const response = await fetch("/api/embeddings/generate");
          const data = await response.json();
          setEmbeddingsStats(data);
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
            data-text="SHAI-HULUD SCAN"
            style={{ fontFamily: "monospace" }}
          >
            SHAI-HULUD SCAN
          </h1>

          <p className="text-lg md:text-xl text-blue-400 font-light mb-4 max-w-2xl mx-auto">
            Tracking{" "}
            <span className="text-white font-bold">Shai-Hulud 2.0</span> and{" "}
            <span className="text-white font-bold">Mini Shai-Hulud</span> supply
            chain attacks. Check if your dependencies are affected.
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
                Shai-Hulud 2.0
              </span>
              <span
                className="text-lg font-bold text-blue-400"
                style={{ fontFamily: "monospace" }}
              >
                {stats?.total
                  ? stats.total - (stats as any).miniCount || 0
                  : 795}
              </span>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/50 px-4 py-2 backdrop-blur-sm">
              <span className="text-xs text-purple-300 uppercase block">
                Mini Shai-Hulud
              </span>
              <span
                className="text-lg font-bold text-purple-400"
                style={{ fontFamily: "monospace" }}
              >
                {(stats as any)?.miniCount || 24}
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
              Databases: Shai-Hulud 2.0 (Nov 2025) + Mini Shai-Hulud (May 2026)
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
              or Mini Shai-Hulud attacks
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
                UPLOAD PACKAGE-LOCK.JSON OR SBOM
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-900/20 border border-red-500 p-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-red-400 mb-4">
                  INFECTED PACKAGES FOUND (
                  {
                    searchResults.filter(
                      (r) =>
                        campaignFilter === "all" ||
                        r.campaign === campaignFilter,
                    ).length
                  }
                  )
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults
                    .filter(
                      (r) =>
                        campaignFilter === "all" ||
                        r.campaign === campaignFilter,
                    )
                    .map((pkg: SearchResult, index: number) => (
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
                            <div className="flex gap-2 mt-2">
                              {pkg.campaign && (
                                <span
                                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                                    pkg.campaign === "mini-shai-hulud"
                                      ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                                      : "bg-blue-900/50 text-blue-300 border border-blue-500/30"
                                  }`}
                                >
                                  {pkg.campaign}
                                </span>
                              )}
                            </div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-500" />
                How the Attack Works
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveAttackTab("shai-hulud-2")}
                  className={`text-xs font-mono py-1 px-3 border transition-colors ${
                    activeAttackTab === "shai-hulud-2"
                      ? "bg-blue-900/50 border-blue-500 text-blue-300"
                      : "bg-black/50 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  Shai-Hulud 2.0
                </button>
                <button
                  onClick={() => setActiveAttackTab("mini-shai-hulud")}
                  className={`text-xs font-mono py-1 px-3 border transition-colors ${
                    activeAttackTab === "mini-shai-hulud"
                      ? "bg-purple-900/50 border-purple-500 text-purple-300"
                      : "bg-black/50 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  Mini Shai-Hulud
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(activeAttackTab === "shai-hulud-2"
                ? [
                    {
                      step: 1,
                      title: "Infection",
                      desc: "Malware runs via 'preinstall' script",
                      icon: Zap,
                    },
                    {
                      step: 2,
                      title: "Theft & Backdoor",
                      desc: "Steals secrets & installs GitHub Runner",
                      icon: Shield,
                    },
                    {
                      step: 3,
                      title: "Exfiltration",
                      desc: "Pushes secrets to public GitHub repos",
                      icon: Eye,
                    },
                    {
                      step: 4,
                      title: "Propagation",
                      desc: "Publishes new infected packages (Worm)",
                      icon: Database,
                    },
                  ]
                : [
                    {
                      step: 1,
                      title: "Account Compromise",
                      desc: "Maintainer account hijacked via phishing",
                      icon: Shield,
                    },
                    {
                      step: 2,
                      title: "Dependency Injection",
                      desc: "Malicious optionalDependencies added to package.json",
                      icon: Zap,
                    },
                    {
                      step: 3,
                      title: "Prepare Script",
                      desc: "Payload delivered via 'exit 1' + 'bun' pattern",
                      icon: Eye,
                    },
                    {
                      step: 4,
                      title: "Harvest",
                      desc: "Secrets exfiltrated before build fails",
                      icon: Database,
                    },
                  ]
              ).map((phase) => (
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

                {/* Campaign Breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-900/20 border border-blue-500/30 p-3">
                    <div className="text-xl font-bold text-blue-400">
                      {(stats as any).shaiHulud2Count ||
                        stats.total - ((stats as any).miniCount || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Shai-Hulud 2.0</div>
                  </div>
                  <div className="bg-purple-900/20 border border-purple-500/30 p-3">
                    <div className="text-xl font-bold text-purple-400">
                      {(stats as any).miniCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">Mini</div>
                  </div>
                </div>

                {stats.stats.map(
                  (
                    stat: {
                      risk_level: string;
                      count: number;
                      percentage: number;
                    },
                    index: number,
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
                  ),
                )}
              </div>
            </section>
          )}

          {/* IOC Summary */}
          <section className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-sm">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              IOC Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 p-3">
                <span className="text-sm text-gray-400">File Hashes</span>
                <span className="text-lg font-bold text-purple-400">4</span>
              </div>
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 p-3">
                <span className="text-sm text-gray-400">Domains</span>
                <span className="text-lg font-bold text-purple-400">5</span>
              </div>
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 p-3">
                <span className="text-sm text-gray-400">Commits</span>
                <span className="text-lg font-bold text-purple-400">4</span>
              </div>
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 p-3">
                <span className="text-sm text-gray-400">Patterns</span>
                <span className="text-lg font-bold text-purple-400">8</span>
              </div>
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 p-3">
                <span className="text-sm text-gray-400">Persistence Paths</span>
                <span className="text-lg font-bold text-purple-400">12</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">
                    Total IOCs
                  </span>
                  <span className="text-xl font-bold text-purple-400">33</span>
                </div>
              </div>
            </div>
          </section>

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

            {/* Campaign Filter */}
            <div className="flex gap-1 mb-3">
              {[
                { id: "all", label: "All" },
                { id: "shai-hulud-2", label: "Shai-Hulud 2.0" },
                { id: "mini-shai-hulud", label: "Mini" },
              ].map((cf) => (
                <button
                  key={cf.id}
                  onClick={() =>
                    setCampaignFilter(cf.id as typeof campaignFilter)
                  }
                  className={`flex-1 text-xs font-mono py-1 px-2 border transition-colors ${
                    campaignFilter === cf.id
                      ? cf.id === "mini-shai-hulud"
                        ? "bg-purple-900/50 border-purple-500 text-purple-300"
                        : cf.id === "shai-hulud-2"
                          ? "bg-blue-900/50 border-blue-500 text-blue-300"
                          : "bg-gray-800 border-gray-500 text-white"
                      : "bg-black/50 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {cf.label}
                </button>
              ))}
            </div>

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
                  <h3 className="font-bold text-white mb-1">
                    Upload package.json
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Upload your package.json, package-lock.json, or SBOM file
                    for complete project analysis including optionalDependencies
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
    </div>
  );
}
