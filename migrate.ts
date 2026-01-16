import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const PHRASE_TOKEN = process.env.PHRASE_TOKEN!
const PROJECT_ID = "5b680920281656ba60082b9ad751e2ba"

const API_BASE = 'https://api.phrase.com/v2'

const headers = {
  Authorization: `token ${PHRASE_TOKEN}`,
  'Content-Type': 'application/json',
}
console.log(headers)

const valuesByLocale = {
  'en': {
    'newFooter.policies': 'Policies',
    'newFooter.privacy': 'Privacy Policy',
  },
  'zh-CN': {
    'newFooter.policies': '政策条款',
    'newFooter.privacy': '隐私政策',
  },
  'ja': {
    'newFooter.policies': 'ポリシー',
    'newFooter.privacy': 'プライバシーポリシー',
  },
}

async function getLocales() {
  const res = await axios.get(
    `${API_BASE}/projects/${PROJECT_ID}/locales`,
    { headers }
  )
  return res.data
}

async function createKeyIfNotExists(keyName: string) {
  try {
    const res = await axios.post(
      `${API_BASE}/projects/${PROJECT_ID}/keys`,
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
    `${API_BASE}/projects/${PROJECT_ID}/translations`,
    {
      key_id: keyId,
      locale_id: localeId,
      content: value,
    },
    { headers }
  )
}

async function main() {
  const locales = await getLocales()

  const localeIdMap: Record<string, string> = {}
  locales.forEach((l: any) => {
    localeIdMap[l.code] = l.id
  })

  const keys = Object.keys(valuesByLocale['en'])

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

// main().catch(console.error)
