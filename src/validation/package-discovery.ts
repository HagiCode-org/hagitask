import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

export interface DiscoveredPackage {
  dirName: string;
  dir: string;
  rel: string;
}

export interface DiscoveryResult {
  packages: DiscoveredPackage[];
  errors: string[];
}

function packageInDir(dir: string, rel: string): DiscoveredPackage | undefined {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return undefined;
  if (!existsSync(join(dir, 'manifest.json'))) return undefined;
  return { dirName: basename(dir), dir, rel };
}

export function discoverPackages(targetPath: string): DiscoveryResult {
  const root = resolve(targetPath);
  if (!existsSync(root)) {
    return { packages: [], errors: [`target path does not exist: ${root}`] };
  }
  if (!statSync(root).isDirectory()) {
    return { packages: [], errors: [`target path is not a directory: ${root}`] };
  }

  const direct = packageInDir(root, basename(root));
  if (direct) return { packages: [direct], errors: [] };

  const layouts = ['presets', 'data'].filter((name) => {
    const path = join(root, name);
    return existsSync(path) && statSync(path).isDirectory();
  });
  if (layouts.length === 0) {
    return {
      packages: [],
      errors: [`unsupported package layout at ${root}; expected presets/<taskId>/, data/<taskId>/, or a package directory containing manifest.json`],
    };
  }

  const packages: DiscoveredPackage[] = [];
  for (const layout of layouts) {
    const layoutDir = join(root, layout);
    for (const entry of readdirSync(layoutDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkg = packageInDir(join(layoutDir, entry.name), `${layout}/${entry.name}`);
      if (pkg) packages.push(pkg);
    }
  }
  packages.sort((a, b) => a.rel.localeCompare(b.rel));
  return { packages, errors: [] };
}
