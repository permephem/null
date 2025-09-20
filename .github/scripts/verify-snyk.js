#!/usr/bin/env node
import { 
  readJsonFile, 
  loadAllowlist, 
  patternMatch,
  reportActionableFindings,
  reportSuccess
} from './security-utils.js';

const [, , resultsPath, allowlistPath] = process.argv;

if (!resultsPath) {
  console.error('Usage: verify-snyk.js <results-path> [allowlist-path]');
  process.exit(2);
}

const results = readJsonFile(resultsPath);
const allowlist = loadAllowlist(allowlistPath);

const failOnSeverity = allowlist.failOnSeverity || ['critical', 'high'];
const allowedVulnerabilities = allowlist.allowedVulnerabilities || [];
const ignoredVulnerabilities = allowlist.ignoredVulnerabilities || [];

// Check if this is a skipped scan
if (results.summary === "Skipped - no token") {
  console.log('Snyk scan was skipped - no token provided');
  process.exit(0);
}

const vulnerabilities = results.vulnerabilities || [];
const actionableVulnerabilities = [];

for (const vuln of vulnerabilities) {
  const severity = vuln.severity?.toLowerCase();
  const vulnId = vuln.id;
  const packageName = vuln.packageName;

  // Skip if severity is not in fail list
  if (!failOnSeverity.includes(severity)) {
    continue;
  }

  // Check if vulnerability is explicitly allowed
  const isAllowed = allowedVulnerabilities.some(allowed => 
    patternMatch(allowed.id, vulnId)
  );

  if (isAllowed) {
    console.log(`✅ Allowed vulnerability: ${vulnId} (${severity})`);
    continue;
  }

  // Check if vulnerability is explicitly ignored
  const isIgnored = ignoredVulnerabilities.some(ignored => {
    return ignored.id === vulnId || ignored.package === packageName;
  });

  if (isIgnored) {
    console.log(`✅ Ignored vulnerability: ${vulnId} (${severity})`);
    continue;
  }

  // Check if it's a dev dependency and we allow those
  if (allowlist.allowDevDependencies && vuln.isDevDependency) {
    console.log(`✅ Dev dependency vulnerability: ${vulnId} (${severity})`);
    continue;
  }

  // Check if it's an optional dependency and we allow those
  if (allowlist.allowOptionalDependencies && vuln.isOptional) {
    console.log(`✅ Optional dependency vulnerability: ${vulnId} (${severity})`);
    continue;
  }

  actionableVulnerabilities.push({
    id: vulnId,
    severity: severity,
    package: packageName,
    title: vuln.title,
    description: vuln.description
  });
}

reportActionableFindings(actionableVulnerabilities, 'Snyk');
reportSuccess('Snyk', 'analysis passed - no unallowlisted high-severity vulnerabilities found.');
