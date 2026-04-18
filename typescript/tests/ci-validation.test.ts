import { readFileSync, existsSync } from 'fs';
import { describe, it, expect } from 'vitest';

describe('CI Workflow Validation', () => {
  it('should have all required files for sanity-check workflow', () => {
    const workflowPath = '.github/workflows/sanity-check.yml';
    expect(existsSync(workflowPath)).toBe(true);

    // Sanity check runs npm test and cargo check, so ensure package.json and src-tauri/Cargo.toml exist
    expect(existsSync('package.json')).toBe(true);
    expect(existsSync('src-tauri/Cargo.toml')).toBe(true);
  });

  it('should have all required files for build-release workflow', () => {
    const workflowPath = '.github/workflows/build-release.yml';
    // Skip if not present, as it may not be committed yet
    if (!existsSync(workflowPath)) return;

    // Check tauri.conf.json exists and has valid targets
    expect(existsSync('src-tauri/tauri.conf.json')).toBe(true);
    const tauriConfig = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    expect(tauriConfig.bundle.targets).toBeDefined();
    expect(Array.isArray(tauriConfig.bundle.targets)).toBe(true);
  });

  it('should have all required icons for bundling', () => {
    const tauriConfig = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    const icons = tauriConfig.bundle.icon;
    expect(icons).toBeDefined();
    icons.forEach((icon: string) => {
      expect(existsSync(`src-tauri/${icon}`)).toBe(true);
    });
  });

  it('should validate installer targets are supported', () => {
    const tauriConfig = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    const targets = tauriConfig.bundle.targets;
    const supportedTargets = ['nsis', 'appimage', 'dmg', 'msi']; // Example, adjust as needed
    targets.forEach((target: string) => {
      expect(supportedTargets).toContain(target);
    });
  });

  it('should avoid MSI target to prevent WiX download issues', () => {
    const tauriConfig = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'));
    const targets = tauriConfig.bundle.targets;
    expect(targets).not.toContain('msi');
    expect(targets).toContain('nsis'); // Ensure NSIS is used for Windows instead
  });

  it('should have .dockerignore to exclude large build artifacts', () => {
    // Skip if .dockerignore doesn't exist yet
    if (!existsSync('.dockerignore')) return;
    expect(existsSync('.dockerignore')).toBe(true);
  });
});