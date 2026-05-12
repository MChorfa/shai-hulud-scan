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

interface SBOMParseResult {
  packages: PackageInfo[];
  format: 'spdx' | 'cyclonedx' | 'package-lock' | 'simple-text' | 'unknown';
  metadata?: {
    name?: string;
    version?: string;
    timestamp?: string;
    tools?: string[];
    lockfileVersion?: number;
  };
}

class SBOMParser {
  /**
   * Parse SBOM content in various formats
   */
  static async parse(content: string, filename?: string): Promise<SBOMParseResult> {
    const trimmedContent = content.trim();
    
    // Try to detect format based on content and filename
    const format = this.detectFormat(trimmedContent, filename);
    
    switch (format) {
      case 'spdx':
        return this.parseSPDX(trimmedContent);
      case 'cyclonedx':
        return this.parseCycloneDX(trimmedContent);
      case 'package-lock':
        return this.parsePackageLock(trimmedContent);
      case 'simple-text':
        return this.parseSimpleText(trimmedContent);
      default:
        // Try all parsers as fallback
        return this.tryAllParsers(trimmedContent);
    }
  }

  /**
   * Detect SBOM format based on content and filename
   */
  private static detectFormat(content: string, filename?: string): 'spdx' | 'cyclonedx' | 'package-lock' | 'simple-text' | 'unknown' {
    // Check filename hints
    if (filename) {
      if (filename.includes('package-lock')) return 'package-lock';
      if (filename.includes('bom') || filename.includes('cyclonedx')) return 'cyclonedx';
      if (filename.includes('spdx')) return 'spdx';
    }

    // Check content patterns
    if (content.includes('SPDXVersion:') || content.includes('PackageName:')) {
      return 'spdx';
    }
    if (content.includes('"bomFormat"') && content.includes('"CycloneDX"')) {
      return 'cyclonedx';
    }
    if (content.includes('"lockfileVersion"') || content.includes('"dependencies"')) {
      return 'package-lock';
    }
    
    // Check for simple text format (one package per line)
    if (content.split('\n').every(line => 
      line.trim() === '' || 
      /^[^@\s]+(@[^@]+)?\s+[\d.=\s^|]+$/.test(line.trim()) ||
      /^@[^@\s]+\/[^@\s]+\s+[\d.=\s^|]+$/.test(line.trim())
    )) {
      return 'simple-text';
    }

    return 'unknown';
  }

  /**
   * Parse SPDX format
   */
  private static parseSPDX(content: string): SBOMParseResult {
    const packages: PackageInfo[] = [];
    const lines = content.split('\n');
    let currentPackage: Partial<PackageInfo> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata: any = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Parse metadata
      if (trimmedLine.startsWith('DocumentName:')) {
        metadata.name = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('DocumentNamespace:')) {
        metadata.timestamp = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('Creator:')) {
        metadata.tools = metadata.tools || [];
        metadata.tools.push(trimmedLine.split(':')[1].trim());
      }
      
      // Parse package information
      if (trimmedLine.startsWith('PackageName:')) {
        if (currentPackage.name) {
          packages.push(currentPackage as PackageInfo);
        }
        currentPackage = { name: trimmedLine.split(':')[1].trim() };
      } else if (trimmedLine.startsWith('PackageVersion:')) {
        currentPackage.version = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('PackageSupplier:')) {
        currentPackage.supplier = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('PackageLicenseDeclared:')) {
        currentPackage.license = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('PackageDownloadLocation:')) {
        currentPackage.homepage = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('PackageComment:')) {
        currentPackage.description = trimmedLine.split(':')[1].trim();
      }
    }

    // Add last package
    if (currentPackage.name) {
      packages.push(currentPackage as PackageInfo);
    }

    return {
      packages,
      format: 'spdx',
      metadata
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
      const metadata: SBOMParseResult['metadata'] = {};

      // Parse metadata
      if (bom.metadata) {
        metadata.name = bom.metadata.component?.name;
        metadata.version = bom.metadata.component?.version;
        metadata.timestamp = bom.metadata.timestamp;
        metadata.tools = bom.metadata.tools?.map((tool) => tool.name).filter((name): name is string => name !== undefined) || [];
      }

      // Parse components
      if (bom.components) {
        for (const component of bom.components) {
          if (component.type === 'library') {
            const pkg: PackageInfo = {
              name: component.name,
              version: component.version,
              type: component.type,
              supplier: component.supplier?.name,
              author: component.author,
              description: component.description,
              homepage: component.purl,
              license: component.licenses?.[0]?.license?.id
            };

            // Add external references
            if (component.externalReferences) {
              pkg.externalReferences = component.externalReferences.map((ref) => ({
                type: ref.type || 'unknown',
                url: ref.url || ''
              }));
            }

            packages.push(pkg);
          }
        }
      }

      return {
        packages,
        format: 'cyclonedx',
        metadata
      };
    } catch (error) {
      console.error('Error parsing CycloneDX:', error);
      return { packages: [], format: 'cyclonedx' };
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
        packages?: Record<string, {
          name?: string;
          version?: string;
          author?: { name?: string };
          description?: string;
          homepage?: string;
          license?: string;
        }>;
      };
      const packages: PackageInfo[] = [];
      const metadata: SBOMParseResult['metadata'] = {};

      // Parse metadata
      metadata.name = lockfile.name;
      metadata.version = lockfile.version;
      metadata.lockfileVersion = lockfile.lockfileVersion;

      // Parse packages
      if (lockfile.packages) {
        for (const [key, pkg] of Object.entries(lockfile.packages)) {
          const packageData = pkg;
          
          // Skip the root package
          if (key === '') continue;

          const pkgInfo: PackageInfo = {
            name: packageData.name || key,
            version: packageData.version,
            type: 'library',
            author: packageData.author?.name,
            description: packageData.description,
            homepage: packageData.homepage,
            license: packageData.license
          };

          packages.push(pkgInfo);
        }
      }

      return {
        packages,
        format: 'package-lock',
        metadata
      };
    } catch (error) {
      console.error('Error parsing package-lock.json:', error);
      return { packages: [], format: 'package-lock' };
    }
  }

  /**
   * Try all parsers as fallback
   */
  private static async tryAllParsers(content: string): Promise<SBOMParseResult> {
    const parsers = [
      () => this.parseSPDX(content),
      () => this.parseCycloneDX(content),
      () => this.parsePackageLock(content)
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
      format: 'unknown'
    };
  }

  /**
   * Validate SBOM structure
   */
  static validate(result: SBOMParseResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!result.packages || result.packages.length === 0) {
      errors.push('No packages found in SBOM');
    }

    for (const pkg of result.packages) {
      if (!pkg.name) {
        errors.push('Package missing name');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse simple text format (one package per line)
   */
  private static parseSimpleText(content: string): SBOMParseResult {
    const packages: PackageInfo[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Parse format: "package-name version" or "@scope/package-name version"
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const version = parts.slice(1).join(' ');
        
        packages.push({
          name,
          version,
          type: 'library'
        });
      }
    }

    return {
      packages,
      format: 'simple-text'
    };
  }

  /**
   * Convert packages to simple format for analysis
   */
  static toSimplePackages(packages: PackageInfo[]): Array<{ name: string; version?: string }> {
    return packages.map(pkg => ({
      name: pkg.name,
      version: pkg.version
    }));
  }
}

export { SBOMParser, type SBOMParseResult, type PackageInfo };
