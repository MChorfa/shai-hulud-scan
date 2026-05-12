import { NextRequest, NextResponse } from "next/server";
import { checkPackage } from "@/lib/db";
import { SBOMParser } from "@/lib/sbom-parser";

// Helper to extract dependencies from raw package-lock.json (fallback)
function findDependencies(lockFile: any, deps = new Set<string>()) {
  if (lockFile.dependencies) {
    for (const [name, detail] of Object.entries(lockFile.dependencies) as [
      string,
      any,
    ][]) {
      const version = detail.version.replace(/^= /, "");
      deps.add(`${name}@${version}`);
      if (detail.dependencies) {
        findDependencies(detail, deps);
      }
    }
  }
  if (lockFile.packages) {
    for (const [pkgPath, detail] of Object.entries(lockFile.packages) as [
      string,
      any,
    ][]) {
      let name = detail.name;
      if (!name && pkgPath.startsWith("node_modules/")) {
        name = pkgPath.replace("node_modules/", "");
      }

      if (name && detail.version) {
        const version = detail.version.replace(/^= /, "");
        deps.add(`${name}@${version}`);
      }
    }
  }
  return deps;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("sbom") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const filename = file.name;

    // Try SBOM parser first (supports package-lock.json, package.json, SPDX, CycloneDX)
    const parseResult = await SBOMParser.parse(text, filename);

    const dependencies = new Set<string>();
    const findings = parseResult.findings || [];

    // Convert parsed packages to name@version set
    for (const pkg of parseResult.packages) {
      if (pkg.name && pkg.version) {
        dependencies.add(`${pkg.name}@${pkg.version}`);
      }
    }

    // Fallback for package-lock.json v1 format that SBOMParser may not capture fully
    if (dependencies.size === 0 && parseResult.format === "package-lock") {
      try {
        const lockFile = JSON.parse(text);
        const rawDeps = findDependencies(lockFile);
        rawDeps.forEach((d) => dependencies.add(d));
      } catch {
        // Ignore fallback parse errors
      }
    }

    const compromisedPackages = [];
    const safePackages = [];

    for (const dep of dependencies) {
      const [name, version] = dep.split("@");
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
    // Each critical finding adds 30 points
    let riskScore = 0;
    for (const pkg of compromisedPackages) {
      if (pkg.risk_level === "critical") riskScore += 20;
      else if (pkg.risk_level === "high") riskScore += 10;
      else if (pkg.risk_level === "medium") riskScore += 5;
      else riskScore += 1;
    }
    for (const finding of findings) {
      if (finding.severity === "critical") riskScore += 30;
      else if (finding.severity === "high") riskScore += 15;
      else if (finding.severity === "medium") riskScore += 5;
    }
    riskScore = Math.min(riskScore, 100);

    return NextResponse.json({
      totalPackages: dependencies.size,
      compromisedPackages,
      safePackages,
      findings,
      riskScore,
      format: parseResult.format,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
