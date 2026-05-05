import fs from 'fs';
import path from 'path';
import os from 'os';

const docsPath = path.join(os.homedir(), 'Documents', 'My Games', 'FarmingSimulator2025');
console.log("Docs path:", docsPath);
if (fs.existsSync(docsPath)) {
  const dirs = fs.readdirSync(docsPath);
  console.log("Dirs:", dirs);
} else {
  console.log("No FS25 folder found.");
}
