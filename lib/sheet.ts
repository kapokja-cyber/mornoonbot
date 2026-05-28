const SHEET_CSV_URL = process.env.SHEET_CSV_URL || ""

let cachedFaq = ""
let cacheTime = 0
const CACHE_TTL = 60 * 1000

export async function getFaq(): Promise<string> {
  const now = Date.now()
  if (cachedFaq && now - cacheTime < CACHE_TTL) {
    return cachedFaq
  }
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`)
    const csv = await res.text()
    cachedFaq = csv
    cacheTime = now
    return csv
  } catch (err) {
    console.error("[sheet] fetch error:", err)
    if (cachedFaq) return cachedFaq
    return ""
  }
}