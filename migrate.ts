import axios from 'axios'
import dotenv from 'dotenv'
import { valuesByLocale } from './valuesByLocale'

dotenv.config()

const API_BASE = 'https://api.phrase.com/v2'

export async function migrateToPhrase(projectId: string, phraseToken?: string) {
  const PHRASE_TOKEN = phraseToken || process.env.PHRASE_TOKEN!
  
  const headers = {
    Authorization: `token ${PHRASE_TOKEN}`,
    'Content-Type': 'application/json',
  }

  async function getLocales() {
    const res = await axios.get(
      `${API_BASE}/projects/${projectId}/locales`,
      { headers }
    )
    return res.data
  }

  async function createKeyIfNotExists(keyName: string) {
    try {
      const res = await axios.post(
        `${API_BASE}/projects/${projectId}/keys`,
        {
          name: keyName,
        },
        { headers }
      )
      return res.data.id
    } catch (err: any) {
      if (err.response?.status === 422) {
        // key 已存在
        return null
      }
      throw err
    }
  }

  async function setTranslation(
    keyId: string,
    localeId: string,
    value: string
  ) {
    await axios.post(
      `${API_BASE}/projects/${projectId}/translations`,
      {
        key_id: keyId,
        locale_id: localeId,
        content: value,
      },
      { headers }
    )
  }

  const locales = await getLocales()

  const localeIdMap: Record<string, string> = {}
  locales.forEach((l: any) => {
    localeIdMap[l.code] = l.id
  })

  const keys = Object.keys(valuesByLocale['zh-CN'])

  for (const key of keys) {
    console.log(`🔑 Processing key: ${key}`)
    const keyId = await createKeyIfNotExists(key)

    if (!keyId) {
      console.log(`⚠️  Key "${key}" already exists, skip creating`)
      continue
    }

    for (const [locale, values] of Object.entries(valuesByLocale)) {
      const localeId = localeIdMap[locale]
      if (!localeId) continue

      const str = (values as any)[key]

      await setTranslation(keyId, localeId, str)
      console.log(`  ✅ ${locale}`)
    }
  }

  console.log('🎉 Done')
}


