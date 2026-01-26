import axios from "axios";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const API_BASE = "https://api.phrase.com/v2";

class Executor {
  executeList: Promise<void>[] = [];

  add(promise: Promise<void>) {
    this.executeList.push(promise);
  }

  execute() {
    return Promise.all(this.executeList);
  }
}

const executor = new Executor();

export async function migrateToPhrase(
  projectId: string,
  valuesByLocale: Record<string, Record<string, string>>,
  existingKeys: Set<string>,
) {
  const PHRASE_TOKEN = process.env.PHRASE_TOKEN!;

  const headers = {
    Authorization: `token ${PHRASE_TOKEN}`,
    "Content-Type": "application/json",
  };

  async function getLocales() {
    const res = await axios.get(`${API_BASE}/projects/${projectId}/locales`, {
      headers,
    });
    return res.data;
  }

  async function createKeyIfNotExists(keyName: string) {
    try {
      const res = await axios.post(
        `${API_BASE}/projects/${projectId}/keys`,
        {
          name: keyName,
        },
        { headers },
      );
      return res.data.id;
    } catch (err: any) {
      if (err.response?.status === 422) {
        // key 已存在
        return null;
      }
      throw err;
    }
  }

  async function setTranslation(
    keyId: string,
    localeId: string,
    value: string,
  ) {
    try {
      await axios.post(
        `${API_BASE}/projects/${projectId}/translations`,
        {
          key_id: keyId,
          locale_id: localeId,
          content: value,
        },
        { headers },
      );
    } catch (error) {
      console.error(
        `❌ Error setting translation for key ${keyId} in locale ${localeId}:`,
        error,
      );
    }
  }

  const locales = await getLocales();

  const localeIdMap: Record<string, string> = {};
  locales.forEach((l: any) => {
    localeIdMap[l.code] = l.id;
  });

  // @ts-ignore
  const keys = Object.keys(valuesByLocale["zh-CN"]);
  console.log(chalk.yellow(`Total keys to migrate: ${keys.length}`));

  for (const key of keys) {
    if (existingKeys.has(key)) {
      console.log(
        chalk.red(
          `⚠️  Key "${key}" already exists in source JSON, skip creating`,
        ),
      );
      continue;
    }

    const progress = chalk.yellow(`(${keys.indexOf(key) + 1}/${keys.length})`);

    console.log(`🔑 Processing key: ${key} ${progress}`);
    const keyId = await createKeyIfNotExists(key);

    if (!keyId) {
      console.log(chalk.red(`⚠️  Key "${key}" already exists, skip creating`));
      continue;
    }

    for (const [locale, values] of Object.entries(valuesByLocale)) {
      const localeId = localeIdMap[locale];
      if (!localeId) continue;

      const str = (values as any)[key];

      executor.add(
        setTranslation(keyId, localeId, str).then(() => {
          console.log(`  ✅ ${locale}`);
        }),
      );
    }
    await executor.execute();
  }

  console.log("🎉 Done");
}
