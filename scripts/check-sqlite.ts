import { initializeDatabase } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

// Reuse the dependency extraction logic
function findDependencies(lockFile: any, deps = new Set<string>()) {
    if (lockFile.dependencies) {
        for (const [name, detail] of Object.entries(lockFile.dependencies) as [string, any][]) {
            const version = detail.version.replace(/^= /, '');
            deps.add(`${name}@${version}`);
            if (detail.dependencies) {
                findDependencies(detail, deps);
            }
        }
    }
    if (lockFile.packages) {
        for (const [pkgPath, detail] of Object.entries(lockFile.packages) as [string, any][]) {
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

async function check() {
    const lockFilePath = process.argv[2] || 'package-lock.json';

    if (!fs.existsSync(lockFilePath)) {
        console.error(`❌ Lockfile not found: ${lockFilePath}`);
        process.exit(1);
    }

    console.log(`🔍 Checking ${lockFilePath} against Shai-Hulud Database...`);

    // 1. Initialize DB
    const db = await initializeDatabase();

    // 2. Parse Lockfile
    const lockFileContent = fs.readFileSync(lockFilePath, 'utf-8');
    const lockFile = JSON.parse(lockFileContent);
    const dependencies = findDependencies(lockFile);

    console.log(`📦 Analyzed ${dependencies.size} unique packages.`);

    // 3. Check against DB
    const infected: Array<{ name: string, version: string, risk_level: string, description: string }> = [];

    // Prepare statement for checking
    const checkStmt = db.prepare('SELECT name, version, risk_level, description FROM packages WHERE name = ? AND version = ?');

    for (const dep of dependencies) {
        const [name, version] = dep.split('@');
        const result = checkStmt.get(name, version) as { name: string, version: string, risk_level: string, description: string } | undefined;

        if (result) {
            infected.push(result);
        }
    }

    // 4. Report
    if (infected.length > 0) {
        console.error('\n🚨 COMPROMISED PACKAGES FOUND! 🚨');
        console.table(infected);
        console.error(`\nFound ${infected.length} infected packages. Immediate action required!`);
        process.exit(1);
    } else {
        console.log('\n✅ No compromised packages found.');
        process.exit(0);
    }
}

check().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
