import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SOURCE_REPO = '/Users/eli/Documents/weex/projects/web-language';
const TARGET_DIR = './pagesJSON';
const KEY_FILE = './key.txt';

function updateGitRepo(repoPath: string): void {
  console.log(`Updating ${repoPath} to latest main branch...`);
  execSync('git checkout main', { cwd: repoPath, stdio: 'inherit' });
  execSync('git pull', { cwd: repoPath, stdio: 'inherit' });
}

function getAllowedKeys(keyFilePath: string): string[] {
  if (!existsSync(keyFilePath)) {
    throw new Error(`Key file not found: ${keyFilePath}`);
  }
  
  const content = readFileSync(keyFilePath, 'utf-8');
  return content
    .split('\n')
    .map(key => key.trim())
    .filter(key => key.length > 0);
}

function processJsonFiles(sourcePath: string, targetPath: string, allowedKeys: string[]): void {
  if (!existsSync(targetPath)) {
    console.log(`Creating target directory: ${targetPath}`);
    mkdirSync(targetPath, { recursive: true });
  }

  const files = readdirSync(sourcePath)
    .filter(file => file.endsWith('.json'));

  if (files.length === 0) {
    console.log(`No JSON files found in ${sourcePath}`);
    return;
  }

  console.log(`Found ${files.length} JSON files. Processing...`);

  for (const file of files) {
    const sourceFilePath = join(sourcePath, file);
    const targetFilePath = join(targetPath, file);

    try {
      const content = readFileSync(sourceFilePath, 'utf-8');
      const data = JSON.parse(content);

      const filteredData = Object.fromEntries(
        Object.entries(data)
          .filter(([key]) => allowedKeys.includes(key))
      );

      writeFileSync(targetFilePath, JSON.stringify(filteredData, null, 2), 'utf-8');
      console.log(`✓ Processed: ${file}`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
}

function main(): void {
  try {
    updateGitRepo(SOURCE_REPO);
    const allowedKeys = getAllowedKeys(KEY_FILE);
    processJsonFiles(SOURCE_REPO, TARGET_DIR, allowedKeys);
    console.log('\nAll files processed successfully!');
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
