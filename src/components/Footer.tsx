import React from "react";

export default function Footer() {
    return (
        <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">🔬</span>
                            Original Research
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            This educational tool is based on groundbreaking security research
                            by the Wiz Research Team who discovered and documented the
                            Shai-Hulud 2.0 supply chain attack.
                        </p>
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400">
                                <span className="text-blue-400 font-semibold">Researchers:</span>{" "}
                                Hila Ramati, Merav Bar, Gal Benmocha, Gili Tikochinski
                            </p>
                            <p className="text-xs text-gray-400">
                                <span className="text-blue-400 font-semibold">Organization:</span>{" "}
                                Wiz Research
                            </p>
                            <p className="text-xs text-gray-400">
                                <span className="text-blue-400 font-semibold">Publication:</span>{" "}
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
                            Created exclusively for educational and awareness purposes to help
                            the security community understand the scope and impact of supply
                            chain attacks.
                        </p>
                        <div className="space-y-2">
                            <p className="text-xs text-gray-400">
                                <span className="text-green-400 font-semibold">Features:</span>{" "}
                                Package analysis, threat visualization, semantic search
                            </p>
                            <p className="text-xs text-gray-400">
                                <span className="text-green-400 font-semibold">Technology:</span>{" "}
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
                                href="https://github.com/MChorfa/shai-hulud-scan"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
                            >
                                💻 Source Code (GitHub)
                            </a>
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
                        ⚠️ This is an educational tool. For production security monitoring,
                        use the official{" "}
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
                        All vulnerability data and attack patterns are based on the original
                        Wiz Research findings.
                    </p>
                </div>
            </div>
        </footer>
    );
}
