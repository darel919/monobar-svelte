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
  const res = await fetch('http://api.server.drl/monobar/v2/changes');
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0];
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
  const latestChange = await fetchLatestChange();
  const commitDate = new Date(commit.date);
  const apiDate = latestChange ? new Date(latestChange.date) : null;
  const apiSha = latestChange ? latestChange.sha_id : null;
  const apiVersion = latestChange ? latestChange.version : null;

  const shouldSend =
    // 1. Git commit is newer than backend
    (!apiDate || commitDate > apiDate) ||
    // 2. Version matches but date is different
    (apiVersion === version && commit.date !== latestChange.date);

  if (shouldSend) {
    const change = {
      date: commit.date,
      sha_id: commit.sha,
      version: version,
      changes: commit.message.replace(/\n/g, ';')
    };
    await postChange(change);
    console.log(`✅ New change sent to backend: ${change.changes}`);
  }
})();

console.log(`✅ Build info generated in src/lib/generated: v${version} (${buildDate})`);
