'use client';

import { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface AnalysisResult {
  totalPackages: number;
  compromisedPackages: Array<{
    name: string;
    version: string;
    riskLevel: string;
    description: string;
    matchedVersion?: string;
  }>;
  safePackages: Array<{
    name: string;
    version: string;
  }>;
  riskScore: number;
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

    const formData = new FormData();
    formData.append('sbom', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
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
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
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
            SBOM Analysis
          </h1>
          <p className="text-gray-400">
            Upload your Software Bill of Materials (SBOM) to analyze dependencies for supply chain vulnerabilities.
            Supports SPDX, CycloneDX, and package-lock.json formats.
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
                ? 'border-red-500 bg-red-900/10'
                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isAnalyzing ? 'Analyzing...' : 'Drop your SBOM file here'}
            </h3>
            <p className="text-gray-400 mb-4">
              or click to browse
            </p>
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".json,.xml,.txt,.spdx,.cyclonedx"
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
              <h2 className="text-2xl font-bold text-white mb-4">Analysis Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/50 border border-gray-700 p-4">
                  <div className="text-2xl font-bold text-white">{result.totalPackages}</div>
                  <div className="text-xs text-gray-400">Total Packages</div>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 p-4">
                  <div className="text-2xl font-bold text-red-500">{result.compromisedPackages.length}</div>
                  <div className="text-xs text-gray-400">Compromised</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 p-4">
                  <div className="text-2xl font-bold text-green-500">{result.safePackages.length}</div>
                  <div className="text-xs text-gray-400">Safe</div>
                </div>
                <div className={`p-4 border ${
                  result.riskScore > 50 ? 'bg-red-900/20 border-red-500/30' :
                  result.riskScore > 20 ? 'bg-yellow-900/20 border-yellow-500/30' :
                  'bg-green-900/20 border-green-500/30'
                }`}>
                  <div className={`text-2xl font-bold ${
                    result.riskScore > 50 ? 'text-red-500' :
                    result.riskScore > 20 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>{result.riskScore}%</div>
                  <div className="text-xs text-gray-400">Risk Score</div>
                </div>
              </div>
            </div>

            {/* Compromised Packages */}
            {result.compromisedPackages.length > 0 && (
              <div className="bg-[#0a0a0a] border border-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Vulnerable Packages ({result.compromisedPackages.length})
                </h2>
                
                <div className="space-y-3">
                  {result.compromisedPackages.map((pkg, index) => (
                    <div key={index} className="bg-black/50 border border-red-800/50 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-mono text-red-400 font-bold">{pkg.name}</h4>
                          <p className="text-xs text-gray-400">Version: {pkg.version}</p>
                          {pkg.matchedVersion && (
                            <p className="text-xs text-yellow-400">Matched: {pkg.matchedVersion}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-mono ${
                          pkg.riskLevel === 'critical' ? 'bg-red-900 text-red-300' :
                          pkg.riskLevel === 'high' ? 'bg-red-800 text-red-400' :
                          'bg-yellow-900 text-yellow-400'
                        }`}>
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
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Safe Packages ({result.safePackages.length})
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.safePackages.map((pkg, index) => (
                    <div key={index} className="bg-black/50 border border-green-800/50 p-3">
                      <h4 className="font-mono text-green-400 font-bold">{pkg.name}</h4>
                      <p className="text-xs text-gray-400">Version: {pkg.version}</p>
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
