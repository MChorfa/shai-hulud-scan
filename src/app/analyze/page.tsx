"use client";

import { useState } from "react";
import {
  Upload,
  AlertTriangle,
  XCircle,
  FileText,
  Bug,
  Terminal,
  Package,
  ShieldAlert,
  Hash,
  BarChart3,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface AnalysisResult {
  totalPackages: number;
  compromisedPackages: Array<{
    name: string;
    version: string;
    riskLevel: string;
    description: string;
    matchedVersion?: string;
    campaign?: string;
  }>;
  safePackages: Array<{
    name: string;
    version: string;
  }>;
  findings?: Array<{
    type: string;
    severity: string;
    message: string;
    details: string;
  }>;
  riskScore: number;
  format?: string;
}

export default function AnalyzePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Check if running on GitHub Pages (static export)
      const isGitHubPages = process.env.NODE_ENV === "production";

      if (isGitHubPages) {
        // Client-side analysis for GitHub Pages
        const text = await file.text();

        // Dynamically import static DB functions and SBOM parser
        const { checkPackageStatic } = await import("@/lib/static-db");
        const { SBOMParser } = await import("@/lib/sbom-parser");

        const parseResult = await SBOMParser.parse(text, file.name);

        const dependencies = new Set<string>();
        const findings = parseResult.findings || [];

        for (const pkg of parseResult.packages) {
          if (pkg.name && pkg.version) {
            dependencies.add(`${pkg.name}@${pkg.version}`);
          }
        }

        // Fallback for package-lock.json v1
        if (dependencies.size === 0 && parseResult.format === "package-lock") {
          try {
            const lockFile = JSON.parse(text) as Record<string, unknown>;
            const findDependencies = (
              node: Record<string, unknown>,
              deps = new Set<string>(),
            ) => {
              const depsMap = node.dependencies as
                | Record<string, Record<string, unknown>>
                | undefined;
              if (depsMap) {
                for (const [name, detail] of Object.entries(depsMap)) {
                  const version = (
                    detail.version as string | undefined
                  )?.replace(/^= /, "");
                  if (version) deps.add(`${name}@${version}`);
                  if (detail.dependencies) {
                    findDependencies(detail, deps);
                  }
                }
              }
              const packagesMap = node.packages as
                | Record<string, Record<string, unknown>>
                | undefined;
              if (packagesMap) {
                for (const [pkgPath, detail] of Object.entries(packagesMap)) {
                  let name = detail.name as string | undefined;
                  if (!name && pkgPath.startsWith("node_modules/")) {
                    name = pkgPath.replace("node_modules/", "");
                  }
                  const version = (
                    detail.version as string | undefined
                  )?.replace(/^= /, "");
                  if (name && version) {
                    deps.add(`${name}@${version}`);
                  }
                }
              }
              return deps;
            };
            const rawDeps = findDependencies(lockFile);
            rawDeps.forEach((d) => dependencies.add(d));
          } catch {
            // Ignore fallback errors
          }
        }

        const compromisedPackages = [];
        const safePackages = [];

        for (const dep of dependencies) {
          const [name, version] = dep.split("@");
          const result = await checkPackageStatic(name, version);

          if (result) {
            compromisedPackages.push({
              name: result.name,
              version: result.version,
              riskLevel: result.risk_level,
              description: result.description || "",
              campaign: result.campaign || "",
            });
          } else {
            safePackages.push({ name, version });
          }
        }

        // Calculate Risk Score
        let riskScore = 0;
        for (const pkg of compromisedPackages) {
          if (pkg.riskLevel === "critical") riskScore += 20;
          else if (pkg.riskLevel === "high") riskScore += 10;
          else if (pkg.riskLevel === "medium") riskScore += 5;
          else riskScore += 1;
        }
        for (const finding of findings) {
          if (finding.severity === "critical") riskScore += 30;
          else if (finding.severity === "high") riskScore += 15;
          else if (finding.severity === "medium") riskScore += 5;
        }
        riskScore = Math.min(riskScore, 100);

        setResult({
          totalPackages: dependencies.size,
          compromisedPackages,
          safePackages,
          findings,
          riskScore,
          format: parseResult.format,
        });
      } else {
        // Server-side analysis for Development/Docker
        const formData = new FormData();
        formData.append("sbom", file);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Analysis failed");
        }

        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-red-50 selection:bg-red-900 selection:text-white">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-500" />
            Dependency & SBOM Analysis
          </h1>
          <p className="text-gray-400">
            Upload your package.json, package-lock.json, or SBOM file to scan
            for compromised packages and malicious IOC patterns from both
            Shai-Hulud 2.0 and Mini Shai-Hulud campaigns.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? "border-red-500 bg-red-900/10"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
            }`}
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isAnalyzing
                ? "Analyzing..."
                : "Drop your SBOM, package-lock.json, or package.json file here"}
            </h3>
            <p className="text-gray-400 mb-4">or click to browse</p>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".json,.xml,.txt,.spdx,.cyclonedx,package.json"
              disabled={isAnalyzing}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 bg-red-900/50 border border-red-500 text-white px-6 py-2 font-mono hover:bg-red-900/70 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Choose File
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="font-bold">Analysis Error</span>
            </div>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Analysis Summary
                </h2>
                {result.format && (
                  <span className="bg-blue-900/50 border border-blue-500/50 text-blue-300 px-3 py-1 text-xs font-mono rounded-full">
                    {result.format}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/50 border border-gray-700 p-4">
                  <div className="text-2xl font-bold text-white">
                    {result.totalPackages}
                  </div>
                  <div className="text-xs text-gray-400">Total Packages</div>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 p-4">
                  <div className="text-2xl font-bold text-red-500">
                    {result.compromisedPackages.length}
                  </div>
                  <div className="text-xs text-gray-400">Compromised</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 p-4">
                  <div className="text-2xl font-bold text-green-500">
                    {result.safePackages.length}
                  </div>
                  <div className="text-xs text-gray-400">Safe</div>
                </div>
                <div
                  className={`p-4 border ${
                    result.riskScore > 50
                      ? "bg-red-900/20 border-red-500/30"
                      : result.riskScore > 20
                        ? "bg-yellow-900/20 border-yellow-500/30"
                        : "bg-green-900/20 border-green-500/30"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      result.riskScore > 50
                        ? "text-red-500"
                        : result.riskScore > 20
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {result.riskScore}%
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.riskScore > 50
                          ? "bg-red-500"
                          : result.riskScore > 20
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${result.riskScore}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Risk Score</div>
                </div>
              </div>
            </div>

            {/* Findings from package.json IOC detection */}
            {result.findings && result.findings.length > 0 && (
              <div className="bg-[#0a0a0a] border border-red-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  IOC Findings ({result.findings.length})
                </h2>
                {/* Group findings by severity */}
                {["critical", "high", "medium", "low"].map((sev) => {
                  const group = result.findings!.filter(
                    (f) => f.severity === sev,
                  );
                  if (group.length === 0) return null;
                  return (
                    <div key={sev} className="mb-4">
                      <h3
                        className={`text-sm font-bold uppercase tracking-wider mb-2 ${
                          sev === "critical"
                            ? "text-red-500"
                            : sev === "high"
                              ? "text-orange-500"
                              : sev === "medium"
                                ? "text-yellow-500"
                                : "text-gray-500"
                        }`}
                      >
                        {sev} ({group.length})
                      </h3>
                      <div className="space-y-3">
                        {group.map((finding, index) => {
                          const FindingIcon =
                            finding.type === "malicious_optional_dependency"
                              ? Bug
                              : finding.type === "suspicious_script"
                                ? Terminal
                                : finding.type === "ioc_match"
                                  ? Hash
                                  : finding.type === "compromised_package"
                                    ? Package
                                    : ShieldAlert;
                          return (
                            <div
                              key={index}
                              className="bg-black/50 border border-red-800/50 p-4 rounded"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <FindingIcon className="w-4 h-4 text-red-400 shrink-0" />
                                  <h4 className="font-mono text-red-400 font-bold text-sm">
                                    {finding.type}
                                  </h4>
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-mono rounded ${
                                    finding.severity === "critical"
                                      ? "bg-red-900 text-red-300"
                                      : finding.severity === "high"
                                        ? "bg-orange-900 text-orange-300"
                                        : finding.severity === "medium"
                                          ? "bg-yellow-900 text-yellow-300"
                                          : "bg-gray-800 text-gray-300"
                                  }`}
                                >
                                  {finding.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-1">
                                {finding.message}
                              </p>
                              <p className="text-sm text-gray-300">
                                {finding.details}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compromised Packages */}
            {result.compromisedPackages.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Vulnerable Packages ({result.compromisedPackages.length})
                </h2>

                <div className="space-y-3">
                  {result.compromisedPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="bg-black/50 border border-red-800/50 p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-mono text-red-400 font-bold">
                            {pkg.name}
                          </h4>
                          <p className="text-xs text-gray-400">
                            Version: {pkg.version}
                          </p>
                          {pkg.matchedVersion && (
                            <p className="text-xs text-yellow-400">
                              Matched: {pkg.matchedVersion}
                            </p>
                          )}
                          {pkg.campaign && (
                            <span
                              className={`inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded ${
                                pkg.campaign === "mini-shai-hulud"
                                  ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                                  : "bg-blue-900/50 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {pkg.campaign}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-mono ${
                            pkg.riskLevel === "critical"
                              ? "bg-red-900 text-red-300"
                              : pkg.riskLevel === "high"
                                ? "bg-red-800 text-red-400"
                                : "bg-yellow-900 text-yellow-400"
                          }`}
                        >
                          {pkg.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{pkg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safe Packages */}
            {result.safePackages.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                  Safe Packages ({result.safePackages.length})
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.safePackages.map((pkg, index) => (
                    <div
                      key={index}
                      className="bg-black/50 border border-green-800/50 p-3"
                    >
                      <h4 className="font-mono text-green-400 font-bold">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Version: {pkg.version}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
