const fs = require('fs');
const path = require('path');
const https = require('https');

const DEFAULT_DB_URL = 'https://mchorfa.github.io/shai-hulud-scan/data/packages.json';
const LOCK_FILE = 'package-lock.json';

// Parse command line arguments
const args = process.argv.slice(2);
let dbUrl = DEFAULT_DB_URL;
let lockFilePath = LOCK_FILE;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
        dbUrl = args[i + 1];
        i++;
    } else if (args[i] === '--file' && args[i + 1]) {
        lockFilePath = args[i + 1];
        i++;
    }
}

console.log(`\x1b[36m🛡️  Shai-Hulud Security Check\x1b[0m`);
console.log(`Checking \x1b[33m${lockFilePath}\x1b[0m against database...`);

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
                } catch (e) {
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

async function run() {
    try {
        // 1. Read package-lock.json
        if (!fs.existsSync(lockFilePath)) {
            console.error(`\x1b[31mError: ${lockFilePath} not found.\x1b[0m`);
            process.exit(1);
        }

        const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
        const lockFile = JSON.parse(lockFileContent);

        // 2. Extract dependencies
        const dependencies = findDependencies(lockFile);
        console.log(`Analyzed \x1b[36m${dependencies.size}\x1b[0m unique packages.`);

        // 3. Fetch compromised database
        console.log(`Fetching database from ${dbUrl}...`);
        const compromisedPackages = await fetchDatabase(dbUrl);

        // 4. Check for matches
        const infected = [];
        for (const pkg of compromisedPackages) {
            const key = `${pkg.name}@${pkg.version}`;
            if (dependencies.has(key)) {
                infected.push(pkg);
            }
        }

        // 5. Report
        if (infected.length > 0) {
            console.error(`\n\x1b[41m\x1b[37m ⚠️  CRITICAL: FOUND ${infected.length} INFECTED PACKAGES \x1b[0m\n`);
            infected.forEach(pkg => {
                console.error(`\x1b[31m[INFECTED] ${pkg.name}@${pkg.version}\x1b[0m`);
                console.error(`   Risk: ${pkg.risk_level}`);
                if (pkg.description) console.error(`   Desc: ${pkg.description}`);
                console.error('');
            });
            console.error(`\x1b[33mImmediate action required: Remove these packages immediately.\x1b[0m`);
            process.exit(1);
        } else {
            console.log(`\n\x1b[32m✅ No compromised packages found.\x1b[0m`);
            console.log(`Scanned against ${compromisedPackages.length} known threats.`);
            process.exit(0);
        }

    } catch (error) {
        console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
        process.exit(1);
    }
}

run();
