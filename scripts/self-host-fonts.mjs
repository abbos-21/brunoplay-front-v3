// One-off: downloads the fonts the game uses from Google Fonts into public/fonts and prints the @font-face rules that
// point at those files (they are pasted into index.html). Only the alphabets the game shows are kept: English and Russian.
//   node scripts/self-host-fonts.mjs
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const UA = 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&family=Nunito:wght@500..900&display=swap'
const KEEP = { 'Baloo 2': ['latin', 'latin-ext'], Nunito: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'] }
const OUT = fileURLToPath(new URL('../public/fonts/', import.meta.url))
fs.mkdirSync(OUT, { recursive: true })

const css = await (await fetch(CSS_URL, { headers: { 'user-agent': UA } })).text()
const rules = []
for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
  const subset = m[1]
  const body = m[2]
  const family = /font-family:\s*'([^']+)'/.exec(body)[1]
  if (!KEEP[family]?.includes(subset)) continue
  const url = /url\(([^)]+)\)/.exec(body)[1]
  const file = `${family.toLowerCase().replace(/\s+/g, '-')}-${subset}.woff2`
  fs.writeFileSync(OUT + file, Buffer.from(await (await fetch(url)).arrayBuffer()))
  const weight = /font-weight:\s*([^;]+);/.exec(body)[1]
  const range = /unicode-range:\s*([^;]+);/.exec(body)[1]
  rules.push(`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${file}) format('woff2');unicode-range:${range}}`)
  console.log(file, (fs.statSync(OUT + file).size / 1024).toFixed(1), 'KB')
}
fs.writeFileSync(OUT + 'fonts.css.txt', rules.join('\n') + '\n')
