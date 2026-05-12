/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const https = require('https');

const DEFAULT_PKG_URL = 'https://mchorfa.github.io/shai-hulud-scan/data/packages.json';
const DEFAULT_IOC_URL = 'https://mchorfa.github.io/shai-hulud-scan/data/iocs.json';
const LOCK_FILE = 'package-lock.json';

// Parse command line arguments
const args = process.argv.slice(2);
let pkgUrl = DEFAULT_PKG_URL;
let iocUrl = DEFAULT_IOC_URL;
let scanFilePath = LOCK_FILE;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
        pkgUrl = args[i + 1];
        i++;
    } else if (args[i] === '--ioc-url' && args[i + 1]) {
        iocUrl = args[i + 1];
        i++;
    } else if (args[i] === '--file' && args[i + 1]) {
        scanFilePath = args[i + 1];
        i++;
    }
}

console.log(`\x1b[36m🛡️  Shai-Hulud Security Check\x1b[0m`);
console.log(`Checking \x1b[33m${scanFilePath}\x1b[0m against database...`);

async function fetchDatabase(url) {
    return new Promise((resolve, reject) => {
        if (url.startsWith('file://')) {
            // Local file support for testing
            try {
                const data = fs.readFileSync(url.replace('file://', ''), 'utf8');
                resolve(JSON.parse(data));
            } catch (err) {
                reject(err);
            }
            return;
        }

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch database: Status Code ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (_) {
                    reject(new Error('Failed to parse database JSON'));
                }
            });
        }).on('error', reject);
    });
}

function findDependencies(lockFile, deps = new Set()) {
    if (lockFile.dependencies) {
        for (const [name, detail] of Object.entries(lockFile.dependencies)) {
            const version = detail.version.replace(/^= /, '');
            deps.add(`${name}@${version}`);
            if (detail.dependencies) {
                findDependencies(detail, deps);
            }
        }
    }
    if (lockFile.packages) {
        for (const [pkgPath, detail] of Object.entries(lockFile.packages)) {
            let name = detail.name;
            if (!name && pkgPath.startsWith('node_modules/')) {
                name = pkgPath.replace('node_modules/', '');
            }

            if (name && detail.version) {
                const version = detail.version.replace(/^= /, '');
                deps.add(`${name}@${version}`);
            }
        }
    }
    return deps;
}

function checkPackageJson(content, iocs) {
    const findings = [];
    try {
        const pkg = JSON.parse(content);

        // Check optionalDependencies for malicious patterns
        if (pkg.optionalDependencies) {
            for (const [depName, depSpec] of Object.entries(pkg.optionalDependencies)) {
                if (depName === '@tanstack/setup' && depSpec.includes('github:tanstack/router#79ac49ee')) {
                    findings.push({
                        type: 'malicious_optional_dependency',
                        severity: 'critical',
                        message: `Malicious optional dependency detected: "${depName}": "${depSpec}"`,
                        details: 'This is the Mini Shai-Hulud worm injection vector (GHSA-g7cv-rxg3-hmpx)'
                    });
                }
                // Check against IOC patterns
                for (const ioc of iocs) {
                    if (ioc.type === 'pattern' && depSpec.includes(ioc.value)) {
                        findings.push({
                            type: 'ioc_match',
                            severity: 'critical',
                            message: `IOC match in optionalDependencies: ${ioc.value}`,
                            details: ioc.description || 'Matched known malicious pattern'
                        });
                    }
                }
            }
        }

        // Check scripts for suspicious patterns
        if (pkg.scripts) {
            for (const [scriptName, scriptValue] of Object.entries(pkg.scripts)) {
                const lowerValue = scriptValue.toLowerCase();
                if (scriptName === 'prepare' && lowerValue.includes('exit 1') && lowerValue.includes('bun')) {
                    findings.push({
                        type: 'suspicious_script',
                        severity: 'critical',
                        message: `Suspicious prepare script: ${scriptValue}`,
                        details: 'Contains "exit 1" and "bun" — Mini Shai-Hulud payload delivery pattern'
                    });
                }
                if (lowerValue.includes('router_init.js') || lowerValue.includes('tanstack_runner.js')) {
                    findings.push({
                        type: 'suspicious_script',
                        severity: 'critical',
                        message: `Known malicious payload in script "${scriptName}"`,
                        details: `References known Mini Shai-Hulud payload files: ${scriptValue}`
                    });
                }
            }
        }
    } catch (_) {
        // Not valid package.json, ignore
    }
    return findings;
}

async function run() {
    try {
        // 1. Read scan file
        if (!fs.existsSync(scanFilePath)) {
            console.error(`\x1b[31mError: ${scanFilePath} not found.\x1b[0m`);
            process.exit(1);
        }

        const fileContent = fs.readFileSync(scanFilePath, 'utf8');
        let parsedJson;
        try {
            parsedJson = JSON.parse(fileContent);
        } catch (_) {
            console.error(`\x1b[31mError: ${scanFilePath} is not valid JSON.\x1b[0m`);
            process.exit(1);
        }
        // Detect format by content: package-lock.json has lockfileVersion; package.json has name+version+dependencies without lockfileVersion
        const isPackageJson = !!(parsedJson.name && parsedJson.version && parsedJson.dependencies && !parsedJson.lockfileVersion);
        const isPackageLock = !!parsedJson.lockfileVersion;

        // 2. Extract dependencies (for lockfiles) or parse package.json
        let dependencies = new Set();
        let pkgJsonFindings = [];

        if (isPackageJson) {
            console.log('Detected package.json — will scan for IOC patterns and dependency matches.');
        } else if (isPackageLock) {
            dependencies = findDependencies(parsedJson);
            console.log(`Analyzed \x1b[36m${dependencies.size}\x1b[0m unique packages from lockfile.`);
        } else {
            console.log(`Warning: Could not detect file format. Assuming package-lock.json.`);
            dependencies = findDependencies(parsedJson);
        }

        // 3. Fetch compromised databases
        console.log(`Fetching package database...`);
        const compromisedPackages = await fetchDatabase(pkgUrl);
        console.log(`Fetching IOC database...`);
        let iocs = [];
        try {
            iocs = await fetchDatabase(iocUrl);
        } catch (err) {
            console.warn(`Could not fetch IOC database: ${err.message}`);
        }

        // 4. Check package.json for IOC patterns
        if (isPackageJson) {
            pkgJsonFindings = checkPackageJson(fileContent, iocs);
        }

        // 5. Check for package matches
        const infected = [];
        if (!isPackageJson) {
            for (const pkg of compromisedPackages) {
                const key = `${pkg.name}@${pkg.version}`;
                if (dependencies.has(key)) {
                    infected.push(pkg);
                }
            }
        } else {
            // For package.json, also check direct dependencies
            try {
                const pkg = JSON.parse(fileContent);
                const allDeps = {
                    ...pkg.dependencies,
                    ...pkg.devDependencies,
                    ...pkg.optionalDependencies
                };
                for (const [name, version] of Object.entries(allDeps)) {
                    if (!version || typeof version !== 'string') continue;
                    // Normalize version for matching
                    const normVersion = version.replace(/^= /, '');
                    const match = compromisedPackages.find(p => p.name === name && p.version === normVersion);
                    if (match) {
                        infected.push(match);
                    }
                }
            } catch (_) {
                // Ignore parse errors
            }
        }

        // 6. Report
        let hasIssues = infected.length > 0 || pkgJsonFindings.length > 0;

        if (infected.length > 0) {
            console.error(`\n\x1b[41m\x1b[37m ⚠️  CRITICAL: FOUND ${infected.length} INFECTED PACKAGES \x1b[0m\n`);
            infected.forEach(pkg => {
                const campaignLabel = pkg.campaign ? ` [${pkg.campaign}]` : '';
                console.error(`\x1b[31m[INFECTED${campaignLabel}] ${pkg.name}@${pkg.version}\x1b[0m`);
                console.error(`   Risk: ${pkg.risk_level}`);
                if (pkg.description) console.error(`   Desc: ${pkg.description}`);
                console.error('');
            });
        }

        if (pkgJsonFindings.length > 0) {
            console.error(`\n\x1b[41m\x1b[37m ⚠️  CRITICAL: FOUND ${pkgJsonFindings.length} MALICIOUS PATTERNS \x1b[0m\n`);
            pkgJsonFindings.forEach(finding => {
                const color = finding.severity === 'critical' ? '\x1b[31m' : '\x1b[33m';
                console.error(`${color}[${finding.severity.toUpperCase()}] ${finding.type}\x1b[0m`);
                console.error(`   ${finding.message}`);
                if (finding.details) console.error(`   Details: ${finding.details}`);
                console.error('');
            });
        }

        if (hasIssues) {
            console.error(`\x1b[33mImmediate action required: Remove these packages/patterns immediately.\x1b[0m`);
            process.exit(1);
        } else {
            console.log(`\n\x1b[32m✅ No compromised packages or malicious patterns found.\x1b[0m`);
            console.log(`Scanned against ${compromisedPackages.length} known threats and ${iocs.length} IOCs.`);
            process.exit(0);
        }

    } catch (error) {
        console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
        process.exit(1);
    }
}

run();
