#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '..', 'logs', 'vitest-output.json');
if (!fs.existsSync(rawPath)) {
  console.error('vitest-output.json not found — run vitest with --reporter=json first');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
const stage = process.argv[2] ?? 'all';
const date = new Date().toISOString().replace('T', ' ').substring(0, 19);

let total = 0, passed = 0, failed = 0, skipped = 0;
const testLines = [];

for (const file of raw.testResults) {
  for (const test of file.assertionResults) {
    total++;
    const status = test.status;
    if (status === 'passed') passed++;
    else if (status === 'failed') failed++;
    else skipped++;
    const icon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○';
    testLines.push(`| ${icon} | ${test.fullName} | ${status} |`);
  }
}

const durationMs = raw.testResults.reduce(
  (sum, f) => sum + (f.endTime - f.startTime), 0,
);

const content = `# Test Run Log — Etape ${stage}

**Date:** ${date}
**Stage:** ${stage}
**REQ-NF-009:** AC-033

## Summary

| Total | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|
| ${total} | ${passed} | ${failed} | ${skipped} | ${durationMs}ms |

## Individual Tests

| | Test | Status |
|---|---|---|
${testLines.join('\n')}
`;

const filename = `logs/test-log-etape${stage}-${Date.now()}.md`;
fs.writeFileSync(filename, content);
console.log(`Log written to ${filename}`);
