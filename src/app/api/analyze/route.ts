import { NextRequest, NextResponse } from 'next/server';
import { checkPackage } from '@/lib/db';

// Helper to extract dependencies from package-lock.json
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

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('sbom') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        let lockFile;
        try {
            lockFile = JSON.parse(text);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
        }

        const dependencies = findDependencies(lockFile);
        const compromisedPackages = [];
        const safePackages = [];

        for (const dep of dependencies) {
            const [name, version] = dep.split('@');
            const result = await checkPackage(name, version);

            if (result) {
                compromisedPackages.push(result);
            } else {
                safePackages.push({ name, version });
            }
        }

        // Calculate Risk Score (Simple heuristic)
        // 0 = Safe, 100 = Critical
        // Each critical package adds 20 points, high adds 10, medium adds 5
        let riskScore = 0;
        for (const pkg of compromisedPackages) {
            if (pkg.risk_level === 'critical') riskScore += 20;
            else if (pkg.risk_level === 'high') riskScore += 10;
            else if (pkg.risk_level === 'medium') riskScore += 5;
            else riskScore += 1;
        }
        riskScore = Math.min(riskScore, 100);

        return NextResponse.json({
            totalPackages: dependencies.size,
            compromisedPackages,
            safePackages,
            riskScore,
        });

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
