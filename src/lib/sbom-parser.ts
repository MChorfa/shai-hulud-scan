interface PackageInfo {
  name: string;
  version?: string;
  type?: string;
  supplier?: string;
  author?: string;
  description?: string;
  homepage?: string;
  license?: string;
  externalReferences?: Array<{
    type: string;
    url: string;
  }>;
}

interface PackageJsonFinding {
  type:
    | "malicious_optional_dependency"
    | "suspicious_script"
    | "suspicious_file";
  severity: "critical" | "high" | "medium";
  message: string;
  details: string;
}

interface SBOMParseResult {
  packages: PackageInfo[];
  format: "spdx" | "cyclonedx" | "package-lock" | "package-json" | "unknown";
  metadata?: {
    name?: string;
    version?: string;
    timestamp?: string;
    tools?: string[];
    lockfileVersion?: number;
  };
  findings?: PackageJsonFinding[];
}

class SBOMParser {
  /**
   * Parse SBOM content in various formats
   */
  static async parse(
    content: string,
    filename?: string,
  ): Promise<SBOMParseResult> {
    const trimmedContent = content.trim();

    // Try to detect format based on content and filename
    const format = this.detectFormat(trimmedContent, filename);

    switch (format) {
      case "spdx":
        return this.parseSPDX(trimmedContent);
      case "cyclonedx":
        return this.parseCycloneDX(trimmedContent);
      case "package-lock":
        return this.parsePackageLock(trimmedContent);
      case "package-json":
        return this.parsePackageJson(trimmedContent);
      case "simple-text":
        return this.parseSimpleText(trimmedContent);
      default:
        // Try all parsers as fallback
        return this.tryAllParsers(trimmedContent);
    }
  }

  /**
   * Detect SBOM format based on content and filename
   */
  private static detectFormat(
    content: string,
    filename?: string,
  ):
    | "spdx"
    | "cyclonedx"
    | "package-lock"
    | "package-json"
    | "simple-text"
    | "unknown" {
    // Check filename hints
    if (filename) {
      if (filename.includes("package-lock")) return "package-lock";
      if (filename === "package.json" || filename.endsWith("/package.json"))
        return "package-json";
      if (filename.includes("bom") || filename.includes("cyclonedx"))
        return "cyclonedx";
      if (filename.includes("spdx")) return "spdx";
    }

    // Check content patterns
    if (content.includes("SPDXVersion:") || content.includes("PackageName:")) {
      return "spdx";
    }
    if (content.includes('"bomFormat"') && content.includes('"CycloneDX"')) {
      return "cyclonedx";
    }
    if (content.includes('"lockfileVersion"')) {
      return "package-lock";
    }
    if (
      content.includes('"name"') &&
      content.includes('"version"') &&
      content.includes('"dependencies"') &&
      !content.includes('"lockfileVersion"')
    ) {
      return "package-json";
    }

    // Check for simple text format (one package per line)
    if (
      content
        .split("\n")
        .every(
          (line) =>
            line.trim() === "" ||
            /^[^@\s]+(@[^@]+)?\s+[\d.=\s^|]+$/.test(line.trim()) ||
            /^@[^@\s]+\/[^@\s]+\s+[\d.=\s^|]+$/.test(line.trim()),
        )
    ) {
      return "simple-text";
    }

    return "unknown";
  }

  /**
   * Parse SPDX format
   */
  private static parseSPDX(content: string): SBOMParseResult {
    const packages: PackageInfo[] = [];
    const lines = content.split("\n");
    let currentPackage: Partial<PackageInfo> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata: any = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Parse metadata
      if (trimmedLine.startsWith("DocumentName:")) {
        metadata.name = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("DocumentNamespace:")) {
        metadata.timestamp = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("Creator:")) {
        metadata.tools = metadata.tools || [];
        metadata.tools.push(trimmedLine.split(":")[1].trim());
      }

      // Parse package information
      if (trimmedLine.startsWith("PackageName:")) {
        if (currentPackage.name) {
          packages.push(currentPackage as PackageInfo);
        }
        currentPackage = { name: trimmedLine.split(":")[1].trim() };
      } else if (trimmedLine.startsWith("PackageVersion:")) {
        currentPackage.version = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("PackageSupplier:")) {
        currentPackage.supplier = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("PackageLicenseDeclared:")) {
        currentPackage.license = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("PackageDownloadLocation:")) {
        currentPackage.homepage = trimmedLine.split(":")[1].trim();
      } else if (trimmedLine.startsWith("PackageComment:")) {
        currentPackage.description = trimmedLine.split(":")[1].trim();
      }
    }

    // Add last package
    if (currentPackage.name) {
      packages.push(currentPackage as PackageInfo);
    }

    return {
      packages,
      format: "spdx",
      metadata,
    };
  }

  /**
   * Parse CycloneDX format
   */
  private static parseCycloneDX(content: string): SBOMParseResult {
    try {
      const bom = JSON.parse(content) as {
        metadata?: {
          component?: { name?: string; version?: string };
          timestamp?: string;
          tools?: Array<{ name?: string }>;
        };
        components?: Array<{
          type: string;
          name: string;
          version?: string;
          supplier?: { name?: string };
          author?: string;
          description?: string;
          purl?: string;
          licenses?: Array<{ license?: { id?: string } }>;
          externalReferences?: Array<{ type?: string; url?: string }>;
        }>;
      };
      const packages: PackageInfo[] = [];
      const metadata: SBOMParseResult["metadata"] = {};

      // Parse metadata
      if (bom.metadata) {
        metadata.name = bom.metadata.component?.name;
        metadata.version = bom.metadata.component?.version;
        metadata.timestamp = bom.metadata.timestamp;
        metadata.tools =
          bom.metadata.tools
            ?.map((tool) => tool.name)
            .filter((name): name is string => name !== undefined) || [];
      }

      // Parse components
      if (bom.components) {
        for (const component of bom.components) {
          if (component.type === "library") {
            const pkg: PackageInfo = {
              name: component.name,
              version: component.version,
              type: component.type,
              supplier: component.supplier?.name,
              author: component.author,
              description: component.description,
              homepage: component.purl,
              license: component.licenses?.[0]?.license?.id,
            };

            // Add external references
            if (component.externalReferences) {
              pkg.externalReferences = component.externalReferences.map(
                (ref) => ({
                  type: ref.type || "unknown",
                  url: ref.url || "",
                }),
              );
            }

            packages.push(pkg);
          }
        }
      }

      return {
        packages,
        format: "cyclonedx",
        metadata,
      };
    } catch (error) {
      console.error("Error parsing CycloneDX:", error);
      return { packages: [], format: "cyclonedx" };
    }
  }

  /**
   * Parse package-lock.json format
   */
  private static parsePackageLock(content: string): SBOMParseResult {
    try {
      const lockfile = JSON.parse(content) as {
        name?: string;
        version?: string;
        lockfileVersion?: number;
        packages?: Record<
          string,
          {
            name?: string;
            version?: string;
            author?: { name?: string };
            description?: string;
            homepage?: string;
            license?: string;
          }
        >;
      };
      const packages: PackageInfo[] = [];
      const metadata: SBOMParseResult["metadata"] = {};

      // Parse metadata
      metadata.name = lockfile.name;
      metadata.version = lockfile.version;
      metadata.lockfileVersion = lockfile.lockfileVersion;

      // Parse packages
      if (lockfile.packages) {
        for (const [key, pkg] of Object.entries(lockfile.packages)) {
          const packageData = pkg;

          // Skip the root package
          if (key === "") continue;

          const pkgInfo: PackageInfo = {
            name: packageData.name || key,
            version: packageData.version,
            type: "library",
            author: packageData.author?.name,
            description: packageData.description,
            homepage: packageData.homepage,
            license: packageData.license,
          };

          packages.push(pkgInfo);
        }
      }

      return {
        packages,
        format: "package-lock",
        metadata,
      };
    } catch (error) {
      console.error("Error parsing package-lock.json:", error);
      return { packages: [], format: "package-lock" };
    }
  }

  /**
   * Parse package.json format for optionalDependencies and script analysis
   */
  private static parsePackageJson(content: string): SBOMParseResult {
    try {
      const pkg = JSON.parse(content) as {
        name?: string;
        version?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        optionalDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      const packages: PackageInfo[] = [];
      const findings: PackageJsonFinding[] = [];
      const metadata: SBOMParseResult["metadata"] = {};

      metadata.name = pkg.name;
      metadata.version = pkg.version;

      // Collect all dependencies as PackageInfo
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.optionalDependencies,
      };

      for (const [name, version] of Object.entries(allDeps)) {
        packages.push({
          name,
          version,
          type: "library",
        });
      }

      // Detect malicious optionalDependencies patterns
      if (pkg.optionalDependencies) {
        for (const [depName, depSpec] of Object.entries(
          pkg.optionalDependencies,
        )) {
          // Mini Shai-Hulud: @tanstack/setup with github:tanstack/router#79ac49ee...
          if (
            depName === "@tanstack/setup" &&
            depSpec.includes("github:tanstack/router#79ac49ee")
          ) {
            findings.push({
              type: "malicious_optional_dependency",
              severity: "critical",
              message: "Malicious optional dependency detected",
              details: `Found "${depName}": "${depSpec}" — this is the Mini Shai-Hulud worm injection vector (GHSA-g7cv-rxg3-hmpx)`,
            });
          }
          // Generic github dependency with suspicious orphan commit pattern
          if (depSpec.startsWith("github:") && depSpec.includes("#")) {
            const commitHash = depSpec.split("#")[1];
            if (
              commitHash &&
              commitHash.length >= 12 &&
              /^[a-f0-9]+$/.test(commitHash)
            ) {
              findings.push({
                type: "suspicious_script",
                severity: "medium",
                message: "Suspicious github: dependency with commit hash",
                details: `Dependency "${depName}" references an exact commit hash "${depSpec}". Verify this is legitimate.`,
              });
            }
          }
        }
      }

      // Detect suspicious scripts
      if (pkg.scripts) {
        for (const [scriptName, scriptValue] of Object.entries(pkg.scripts)) {
          const lowerValue = scriptValue.toLowerCase();
          if (
            scriptName === "prepare" &&
            lowerValue.includes("exit 1") &&
            lowerValue.includes("bun")
          ) {
            findings.push({
              type: "suspicious_script",
              severity: "critical",
              message: "Suspicious prepare script detected",
              details: `The "prepare" script contains "exit 1" and "bun" — this is the Mini Shai-Hulud payload delivery pattern: "${scriptValue}"`,
            });
          }
          if (
            lowerValue.includes("router_init.js") ||
            lowerValue.includes("tanstack_runner.js")
          ) {
            findings.push({
              type: "suspicious_script",
              severity: "critical",
              message: "Known malicious payload referenced in script",
              details: `Script "${scriptName}" references known Mini Shai-Hulud payload files: "${scriptValue}"`,
            });
          }
        }
      }

      return {
        packages,
        format: "package-json",
        metadata,
        findings,
      };
    } catch (error) {
      console.error("Error parsing package.json:", error);
      return { packages: [], format: "package-json" };
    }
  }

  /**
   * Try all parsers as fallback
   */
  private static async tryAllParsers(
    content: string,
  ): Promise<SBOMParseResult> {
    const parsers = [
      () => this.parseSPDX(content),
      () => this.parseCycloneDX(content),
      () => this.parsePackageLock(content),
      () => this.parsePackageJson(content),
    ];

    for (const parser of parsers) {
      try {
        const result = parser();
        if (result.packages.length > 0) {
          return result;
        }
      } catch {
        // Continue to next parser
        continue;
      }
    }

    // If no parser worked, return empty result
    return {
      packages: [],
      format: "unknown",
    };
  }

  /**
   * Validate SBOM structure
   */
  static validate(result: SBOMParseResult): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!result.packages || result.packages.length === 0) {
      errors.push("No packages found in SBOM");
    }

    for (const pkg of result.packages) {
      if (!pkg.name) {
        errors.push("Package missing name");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse simple text format (one package per line)
   */
  private static parseSimpleText(content: string): SBOMParseResult {
    const packages: PackageInfo[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Parse format: "package-name version" or "@scope/package-name version"
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const version = parts.slice(1).join(" ");

        packages.push({
          name,
          version,
          type: "library",
        });
      }
    }

    return {
      packages,
      format: "package-lock", // Treat as package-lock for compatibility
    };
  }

  /**
   * Convert packages to simple format for analysis
   */
  static toSimplePackages(
    packages: PackageInfo[],
  ): Array<{ name: string; version?: string }> {
    return packages.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
    }));
  }
}

export {
  SBOMParser,
  type SBOMParseResult,
  type PackageInfo,
  type PackageJsonFinding,
};
