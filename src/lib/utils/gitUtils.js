// Utility to get latest git commit info
// @ts-ignore
import { execSync } from 'child_process';

export function getLatestGitCommit() {
  try {
    const sha = execSync('git rev-parse HEAD').toString().trim();
    const date = execSync('git log -1 --format=%cI').toString().trim();
    const message = execSync('git log -1 --pretty=%B').toString().trim();
    return { sha, date, message };
  } catch (e) {
    return null;
  }
}
