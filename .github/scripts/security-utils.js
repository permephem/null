#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

/**
 * Common utilities for security verification scripts
 */

export function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Failed to read JSON file at ${path}:`, error.message);
    process.exit(2);
  }
}

export function loadAllowlist(allowlistPath) {
  if (!allowlistPath || !existsSync(allowlistPath)) {
    return {};
  }
  return readJsonFile(allowlistPath);
}

export function validateExitCode(exitCodeArg, toolName) {
  const exitCode = exitCodeArg ? Number(exitCodeArg) : 0;
  if (Number.isNaN(exitCode)) {
    console.error(`Invalid ${toolName} exit code received: ${exitCodeArg}`);
    process.exit(2);
  }
  return exitCode;
}

export function checkFatalError(exitCode, toolName) {
  if (exitCode > 1) {
    console.error(`${toolName} terminated with a fatal error (exit code ${exitCode}).`);
    process.exit(exitCode);
  }
}

export function patternMatch(pattern, text) {
  if (!pattern || !text) return false;
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\*/g, '.*');
    return new RegExp(regexPattern).test(text);
  }
  return pattern === text;
}

export function reportActionableFindings(findings, toolName) {
  if (findings.length > 0) {
    console.error(`${toolName} reported security findings that are not allowlisted:`);
    for (const finding of findings) {
      console.error(`\n[${finding.severity || finding.impact}] ${finding.id || finding.check}`);
      if (finding.title || finding.description) {
        console.error(finding.title || finding.description);
      }
      if (finding.package) {
        console.error(`Package: ${finding.package}`);
      }
      if (finding.locations && finding.locations.length > 0) {
        console.error(`Locations: ${finding.locations.join(' || ')}`);
      }
    }
    process.exit(1);
  }
}

export function reportSuccess(toolName, message = 'analysis passed without unallowlisted high-severity findings.') {
  console.log(`✅ ${toolName} ${message}`);
}



