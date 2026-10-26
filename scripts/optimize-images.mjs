// Turns the game's PNG pictures into WebP (about 5 to 10 times smaller, same look) and points the code at the new files.
//   node scripts/optimize-images.mjs          convert every PNG under src/assets and update the references
// Run it again after adding a new PNG. The Ride game's own pictures (src/assets/ride) are left alone on purpose.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('../src/assets', import.meta.url))
const SKIP = ['ride']
const MAX_EDGE = 512 // nothing in the game is drawn bigger than this, even on a 3x screen
const BACKGROUND_EDGE = 1600 // full-screen backgrounds keep their detail

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (SKIP.includes(e.name) ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]))

const files = walk(ROOT).filter((f) => /\.png$/i.test(f))
let before = 0
let after = 0
for (const f of files) {
  const out = f.replace(/\.png$/i, '.webp')
  const meta = await sharp(f).metadata()
  const edge = f.includes(`${path.sep}backgrounds${path.sep}`) ? BACKGROUND_EDGE : MAX_EDGE
  const img = sharp(f).resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
  await img.webp({ quality: 84, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(out)
  before += fs.statSync(f).size
  after += fs.statSync(out).size
  fs.unlinkSync(f)
  console.log(`${path.relative(ROOT, f)}  ${meta.width}x${meta.height}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`)
}

// every reference lives in an index.ts next to the pictures, or in unocss.config.ts
const texts = [...walk(ROOT).filter((f) => f.endsWith('.ts')), fileURLToPath(new URL('../unocss.config.ts', import.meta.url))]
for (const t of texts) {
  const s = fs.readFileSync(t, 'utf8')
  const n = s.replace(/(['"][^'"]*?)\.png(['"])/g, (m, a, b) => (a.includes('/ride/') ? m : `${a}.webp${b}`))
  if (n !== s) fs.writeFileSync(t, n)
}
console.log(`\n${files.length} pictures: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`)
