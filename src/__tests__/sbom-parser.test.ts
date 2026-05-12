import { describe, it, expect } from 'vitest';
import { SBOMParser } from '../lib/sbom-parser';

describe('SBOMParser', () => {
  describe('detectFormat', () => {
    it('detects package-lock.json by filename hint', async () => {
      const content = JSON.stringify({ lockfileVersion: 2, packages: {} });
      const result = await SBOMParser.parse(content, 'package-lock.json');
      expect(result.format).toBe('package-lock');
    });

    it('detects CycloneDX format from content', async () => {
      const bom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        components: [
          { type: 'library', name: 'express', version: '4.18.0' },
        ],
      };
      const result = await SBOMParser.parse(JSON.stringify(bom));
      expect(result.format).toBe('cyclonedx');
      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].name).toBe('express');
    });

    it('detects SPDX format from content', async () => {
      const spdx = `SPDXVersion: SPDX-2.3
PackageName: lodash
PackageVersion: 4.17.21
`;
      const result = await SBOMParser.parse(spdx);
      expect(result.format).toBe('spdx');
      expect(result.packages.length).toBeGreaterThan(0);
      expect(result.packages[0].name).toBe('lodash');
    });
  });

  describe('parsePackageLock', () => {
    it('parses package-lock.json v2 packages section', async () => {
      const lockfile = {
        name: 'my-app',
        version: '1.0.0',
        lockfileVersion: 2,
        packages: {
          '': { name: 'my-app', version: '1.0.0' },
          'node_modules/express': { version: '4.18.0' },
          'node_modules/lodash': { version: '4.17.21' },
        },
      };
      const result = await SBOMParser.parse(JSON.stringify(lockfile), 'package-lock.json');
      expect(result.format).toBe('package-lock');
      // Root package should be skipped
      expect(result.packages.length).toBe(2);
    });
  });

  describe('parseCycloneDX', () => {
    it('returns empty packages for non-library components', async () => {
      const bom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        components: [
          { type: 'framework', name: 'spring', version: '5.0.0' },
        ],
      };
      const result = await SBOMParser.parse(JSON.stringify(bom));
      expect(result.format).toBe('cyclonedx');
      expect(result.packages).toHaveLength(0);
    });
  });

  describe('parseSimpleText', () => {
    it('returns simple-text format (not package-lock)', async () => {
      // A file with one entry per line that matches the simple-text pattern
      const content = 'express 4.18.0\nlodash 4.17.21\n';
      const result = await SBOMParser.parse(content, 'deps.txt');
      // simple-text format is detected when it looks like "name version" lines
      // The format should never be mis-labelled as package-lock
      expect(result.format).not.toBe('package-lock');
    });
  });

  describe('validate', () => {
    it('returns invalid when no packages found', () => {
      const result = SBOMParser.validate({ packages: [], format: 'unknown' });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns valid for well-formed package list', () => {
      const result = SBOMParser.validate({
        packages: [{ name: 'express', version: '4.18.0' }],
        format: 'package-lock',
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('toSimplePackages', () => {
    it('returns name/version pairs', () => {
      const packages = [
        { name: 'express', version: '4.18.0', type: 'library' },
        { name: 'lodash', version: '4.17.21' },
      ];
      const simple = SBOMParser.toSimplePackages(packages);
      expect(simple).toEqual([
        { name: 'express', version: '4.18.0' },
        { name: 'lodash', version: '4.17.21' },
      ]);
    });
  });
});
