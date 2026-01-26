import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { get_locale_file_name } from "./utils";

const SOURCE_REPO = "/Users/eli/Documents/weex/projects/web-language";
const TARGET_FILE = "./valuesByLocale.ts";
const KEY_FILE = "./key.txt";

function updateGitRepo(repoPath: string): void {
  console.log(`Updating ${repoPath} to latest main branch...`);
  execSync("git checkout main", { cwd: repoPath, stdio: "inherit" });
  execSync("git pull", { cwd: repoPath, stdio: "inherit" });
}

function getAllowedKeys(keyFilePath: string): string[] {
  if (!existsSync(keyFilePath)) {
    throw new Error(`Key file not found: ${keyFilePath}`);
  }

  const content = readFileSync(keyFilePath, "utf-8");
  return content
    .split("\n")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function collectTranslations(
  sourcePath: string,
  allowedKeys: string[],
): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {};

  const files = readdirSync(sourcePath).filter((file) =>
    file.endsWith(".json"),
  );

  if (files.length === 0) {
    console.log(`No JSON files found in ${sourcePath}`);
    return translations;
  }

  console.log(`Found ${files.length} JSON files. Processing...`);

  for (const file of files) {
    const sourceFilePath = join(sourcePath, file);
    const fileName = file.replace(".json", "");
    const locale = get_locale_file_name(fileName.toLowerCase())?.code;
    if (!locale) {
      console.error(`No locale found for file: ${file}`);
      continue;
    }

    try {
      const content = readFileSync(sourceFilePath, "utf-8");
      const data = JSON.parse(content);

      const filteredData = Object.fromEntries(
        Object.entries(data)
          .filter(([key]) => allowedKeys.includes(key))
          .sort(([aKey], [bKey]) => allowedKeys.indexOf(aKey) - allowedKeys.indexOf(bKey)),
      );

      if (Object.keys(filteredData).length > 0) {
        translations[locale] = filteredData as Record<string, string>;
      }

      console.log(`✓ Processed: ${file}`);
    } catch (error) {
      console.error(
        `✗ Error processing ${file}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return translations;
}

function generateTypeScriptFile(
  translations: Record<string, Record<string, string>>,
  targetFilePath: string,
): void {
  const content = `export const valuesByLocale = ${JSON.stringify(translations, null, 2)}`;
  writeFileSync(targetFilePath, content, "utf-8");
  console.log(`\nGenerated TypeScript file: ${targetFilePath}`);
}

export function getWebKeyValue() {
  try {
    updateGitRepo(SOURCE_REPO);
    const allowedKeys = getAllowedKeys(KEY_FILE);
    const translations = collectTranslations(SOURCE_REPO, allowedKeys);
    generateTypeScriptFile(translations, TARGET_FILE);
    console.log("\nAll files processed successfully!");
    return {
      webKeyValue: translations,
    };
  } catch (error) {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : String(error),
    );
  }
  return null;
}

// main();
