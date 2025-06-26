import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const generatedDir = path.join(__dirname, 'src', 'lib', 'generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const version = packageJson.version;
const buildDate = new Date().toISOString();
const versionData = {
  version,
  buildDate,
  buildNumber: process.env.BUILD_NUMBER || 'local'
};

const versionInfoFile = path.join(generatedDir, 'version-info.json');

fs.writeFileSync(versionInfoFile, JSON.stringify(versionData, null, 2), 'utf8');

console.log(`✅ Build info generated in src/lib/generated: v${version} (${buildDate})`);
