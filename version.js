<<<<<<< HEAD
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const generatedDir = path.join(__dirname, 'src', 'lib', 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const version = `svelte-${packageJson.version}`;
const buildDate = new Date().toISOString();
const versionData = {
  version,
  buildDate,
  buildNumber: process.env.BUILD_NUMBER || 'local'
};

const versionInfoFile = path.join(generatedDir, 'version-info.json');

fs.writeFileSync(versionInfoFile, JSON.stringify(versionData, null, 2), 'utf8');

// --- GIT + API CHANGELOG LOGIC ---
function getLatestGitCommit() {
  try {
    const sha = execSync('git rev-parse HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cI').toString().trim();
    const message = execSync('git log -1 --pretty=%B').toString().trim();
    return { sha, date, message };
  } catch (e) {
    return null;
  }
}

async function fetchLatestChange() {
  const res = await fetch('http://api.server.drl/monobar/changes/latest');
  if (!res.ok) return null;
  let text;
  try {
    text = await res.text();
    let latest;
    try {
      latest = JSON.parse(text);
    } catch (err) {
      console.error('❌ Failed to parse backend JSON. Raw response:', text);
      throw new Error('Failed to parse backend JSON');
    }
    if (!latest || !latest.version || !latest.sha_id) return null;
    // Normalize backend date to ISO if possible
    if (latest.date && !latest.date.includes('T')) {
      const parsed = new Date(latest.date);
      if (!isNaN(parsed)) latest.date = parsed.toISOString();
    }
    return latest;
  } catch (err) {
    console.error('❌ Error reading backend response:', err);
    throw err;
  }
}

async function postChange(change) {
  await fetch('http://api.server.drl/monobar/changes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change)
  });
}

(async () => {
  const commit = getLatestGitCommit();
  if (!commit) return;
  try {
    const latestChange = await fetchLatestChange();
    const commitDate = new Date(commit.date);
    const apiDate = latestChange ? new Date(latestChange.date) : null;
    const apiSha = latestChange ? latestChange.sha_id : null;
    const apiVersion = latestChange ? latestChange.version : null;

    // Debug logging for comparison
    console.log('[DEBUG] Local version:', version, 'Local date:', commit.date, 'Local sha:', commit.sha);
    if (latestChange) {
      console.log('[DEBUG] Backend version:', apiVersion, 'Backend date:', latestChange.date, 'Backend sha:', apiSha);
    } else {
      console.log('[DEBUG] No backend change found');
    }

    const shouldSend =
      (!apiDate || commitDate > apiDate) ||
      (apiVersion === version && commit.date !== latestChange.date) ||
      (apiVersion !== version); // Always send if version is different

    if (shouldSend) {
      const change = {
        date: commit.date,
        sha_id: commit.sha,
        version: version,
        changes: commit.message.replace(/\n/g, ';')
      };
      await postChange(change);
      console.log(`✅ New change sent to backend: ${change.changes}`);
    } else {
      console.log('ℹ️ No new changes to send to backend.');
    }
  } catch (err) {
    console.error('❌ Error in changelog sync:', err);
  }
})();

console.log(`✅ Build info generated in src/lib/generated: v${version} (${buildDate})`);
=======
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const generatedDir = path.join(__dirname, 'src', 'lib', 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const version = `svelte-${packageJson.version}`;
const buildDate = new Date().toISOString();
const versionData = {
  version,
  buildDate,
  buildNumber: process.env.BUILD_NUMBER || 'local'
};

const versionInfoFile = path.join(generatedDir, 'version-info.json');

fs.writeFileSync(versionInfoFile, JSON.stringify(versionData, null, 2), 'utf8');

// --- GIT + API CHANGELOG LOGIC ---
function getLatestGitCommit() {
  try {
    const sha = execSync('git rev-parse HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cI').toString().trim();
    const message = execSync('git log -1 --pretty=%B').toString().trim();
    return { sha, date, message };
  } catch (e) {
    return null;
  }
}

async function fetchLatestChange() {
  const res = await fetch('http://api.server.drl/monobar/v2/changes/latest');
  if (!res.ok) return null;
  let text;
  try {
    text = await res.text();
    let latest;
    try {
      latest = JSON.parse(text);
    } catch (err) {
      console.error('❌ Failed to parse backend JSON. Raw response:', text);
      throw new Error('Failed to parse backend JSON');
    }
    if (!latest || !latest.version || !latest.sha_id) return null;
    // Normalize backend date to ISO if possible
    if (latest.date && !latest.date.includes('T')) {
      const parsed = new Date(latest.date);
      if (!isNaN(parsed)) latest.date = parsed.toISOString();
    }
    return latest;
  } catch (err) {
    console.error('❌ Error reading backend response:', err);
    throw err;
  }
}

async function postChange(change) {
  await fetch('http://api.server.drl/monobar/v2/changes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change)
  });
}

(async () => {
  const commit = getLatestGitCommit();
  if (!commit) return;
  try {
    const latestChange = await fetchLatestChange();
    const commitDate = new Date(commit.date);
    const apiDate = latestChange ? new Date(latestChange.date) : null;
    const apiSha = latestChange ? latestChange.sha_id : null;
    const apiVersion = latestChange ? latestChange.version : null;

    // Debug logging for comparison
    console.log('[DEBUG] Local version:', version, 'Local date:', commit.date, 'Local sha:', commit.sha);
    if (latestChange) {
      console.log('[DEBUG] Backend version:', apiVersion, 'Backend date:', latestChange.date, 'Backend sha:', apiSha);
    } else {
      console.log('[DEBUG] No backend change found');
    }

    const shouldSend =
      (!apiDate || commitDate > apiDate) ||
      (apiVersion === version && commit.date !== latestChange.date) ||
      (apiVersion !== version); // Always send if version is different

    if (shouldSend) {
      const change = {
        date: commit.date,
        sha_id: commit.sha,
        version: version,
        changes: commit.message.replace(/\n/g, ';')
      };
      await postChange(change);
      console.log(`✅ New change sent to backend: ${change.changes}`);
    } else {
      console.log('ℹ️ No new changes to send to backend.');
    }
  } catch (err) {
    console.error('❌ Error in changelog sync:', err);
  }
})();

console.log(`✅ Build info generated in src/lib/generated: v${version} (${buildDate})`);
>>>>>>> 539b80a (reinit)
