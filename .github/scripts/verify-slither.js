#!/usr/bin/env node
import { 
  readJsonFile, 
  loadAllowlist, 
  validateExitCode, 
  checkFatalError,
  reportActionableFindings,
  reportSuccess
} from './security-utils.js';

const [, , resultsPath, allowlistPath, exitCodeArg] = process.argv;

if (!resultsPath) {
  console.error('Usage: verify-slither.js <results-path> [allowlist-path] [slither-exit-code]');
  process.exit(2);
}

const slitherExitCode = validateExitCode(exitCodeArg, 'slither');

const results = readJsonFile(resultsPath);
if (!results) {
  console.error('Slither results file is empty or malformed.');
  process.exit(2);
}

checkFatalError(slitherExitCode, 'Slither');

const detectors = Array.isArray(results?.results?.detectors) ? results.results.detectors : [];

const allowlist = loadAllowlist(allowlistPath);
const ignoredChecks = new Set(Array.isArray(allowlist.ignoredChecks) ? allowlist.ignoredChecks : []);
const ignoredFindings = Array.isArray(allowlist.ignoredFindings) ? allowlist.ignoredFindings : [];
const failOn = Array.isArray(allowlist.failOn) && allowlist.failOn.length > 0 ? allowlist.failOn : ['High', 'Medium'];

function normalizeDescription(description) {
  if (!description) {
    return '';
  }
  if (typeof description === 'string') {
    return description;
  }
  if (typeof description === 'object') {
    if (typeof description.long === 'string') {
      return description.long;
    }
    if (typeof description.short === 'string') {
      return description.short;
    }
  }
  return '';
}

function collectElementMetadata(element) {
  const metadata = {
    contracts: new Set(),
    functions: new Set(),
    files: new Set(),
  };

  const sourceMapping = element?.source_mapping ?? element?.sourceMapping ?? {};

  const possibleContracts = [
    element?.contract,
    element?.name,
    sourceMapping?.contract,
    sourceMapping?.name,
  ];

  const possibleFunctions = [
    element?.function,
    element?.name,
    sourceMapping?.function,
  ];

  if (element?.type === 'contract' && typeof element?.name === 'string') {
    metadata.contracts.add(element.name);
  }

  if (element?.type === 'function' && typeof element?.name === 'string') {
    metadata.functions.add(element.name);
  }

  for (const contractName of possibleContracts) {
    if (typeof contractName === 'string' && contractName.length > 0) {
      metadata.contracts.add(contractName);
    }
  }

  for (const functionName of possibleFunctions) {
    if (typeof functionName === 'string' && functionName.length > 0) {
      metadata.functions.add(functionName);
    }
  }

  const fileCandidates = [
    sourceMapping?.filename,
    sourceMapping?.absolute,
    sourceMapping?.absolute_path,
    sourceMapping?.relative_path,
  ];

  for (const filePath of fileCandidates) {
    if (typeof filePath === 'string' && filePath.length > 0) {
      metadata.files.add(filePath);
    }
  }

  return {
    contracts: Array.from(metadata.contracts),
    functions: Array.from(metadata.functions),
    files: Array.from(metadata.files),
  };
}

function descriptionIncludes(description, needle) {
  if (!needle) {
    return true;
  }
  return description.toLowerCase().includes(needle.toLowerCase());
}

function matchesAllowlistEntry(entry, finding, metadataList) {
  const check = finding?.check ?? '';
  const impact = finding?.impact ?? '';
  const description = normalizeDescription(finding?.description ?? '');

  if (entry?.check && entry.check !== check) {
    return false;
  }

  if (entry?.impact && entry.impact !== impact) {
    return false;
  }

  if (entry?.descriptionIncludes && !descriptionIncludes(description, entry.descriptionIncludes)) {
    return false;
  }

  if (entry?.contract) {
    const matchesContract = metadataList.some((meta) =>
      meta.contracts.some((name) => name === entry.contract)
    );
    if (!matchesContract) {
      return false;
    }
  }

  if (entry?.function) {
    const matchesFunction = metadataList.some((meta) =>
      meta.functions.some((name) => name === entry.function)
    );
    if (!matchesFunction) {
      return false;
    }
  }

  if (entry?.file) {
    const matchesFile = metadataList.some((meta) =>
      meta.files.some((file) => file === entry.file || file.endsWith(entry.file))
    );
    if (!matchesFile) {
      return false;
    }
  }

  return true;
}

const actionableFindings = [];

for (const finding of detectors) {
  const impact = finding?.impact ?? '';
  const check = finding?.check ?? 'unknown-check';

  if (!failOn.includes(impact)) {
    continue;
  }

  if (ignoredChecks.has(check)) {
    continue;
  }

  const metadataList = Array.isArray(finding?.elements)
    ? finding.elements.map((element) => collectElementMetadata(element))
    : [];

  const isAllowlisted = ignoredFindings.some((entry) => matchesAllowlistEntry(entry, finding, metadataList));

  if (!isAllowlisted) {
    const description = normalizeDescription(finding?.description ?? '');
    const locations = metadataList
      .map((meta) => {
        const contractInfo = meta.contracts.length > 0 ? `contracts: ${meta.contracts.join(', ')}` : null;
        const functionInfo = meta.functions.length > 0 ? `functions: ${meta.functions.join(', ')}` : null;
        const fileInfo = meta.files.length > 0 ? `files: ${meta.files.join(', ')}` : null;
        return [contractInfo, functionInfo, fileInfo].filter(Boolean).join(' | ');
      })
      .filter((value) => value.length > 0);

    actionableFindings.push({
      check,
      impact,
      description,
      locations,
    });
  }
}

reportActionableFindings(actionableFindings, 'Slither');

if (slitherExitCode > 0) {
  console.log('Slither reported findings that are fully allowlisted or below the severity threshold.');
}

reportSuccess('Slither');
