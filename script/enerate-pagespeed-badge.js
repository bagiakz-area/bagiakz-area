const fs = require('fs')
const path = require('path')

const RESULTS_DIR = process.argv[2] || '.lighthouseci'
const SITE_URL = process.argv[3] || process.env.SITE_URL || 'https://your-site.com'
const OUTPUT_PATH = process.argv[4] || 'assets/pagespeed.svg'

function findLatestReport(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('lhr-') && f.endsWith('.json'))
  if (files.length === 0) throw new Error(`Tidak ada file lhr-*.json di folder ${dir}`)
  files.sort()
  return path.join(dir, files[files.length - 1])
}

function loadScores(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const categories = report.categories
  return {
    performance: Math.round(categories.performance.score * 100),
    accessibility: Math.round(categories.accessibility.score * 100),
    bestPractices: Math.round(categories['best-practices'].score * 100),
    seo: Math.round(categories.seo.score * 100),
  }
}

function colorFor(score) {
  if (score >= 90) return '#0cce6a'
  if (score >= 50) return '#ffa400'
  return '#ff4e42'
}

function gauge(cx, cy, radius, score, label) {
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = colorFor(score)
  return `
    <g transform="translate(${cx}, ${cy})">
      <circle r="${radius}" cx="0" cy="0" fill="none" stroke="#2b3038" stroke-width="6" />
      <circle r="${radius}" cx="0" cy="0" fill="none" stroke="${color}" stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray="${progress} ${circumference}"
        transform="rotate(-90)" />
      <text x="0" y="8" text-anchor="middle" font-size="26" font-weight="700" fill="${color}" font-family="Segoe UI, Helvetica, Arial, sans-serif">${score}</text>
      <text x="0" y="${radius + 28}" text-anchor="middle" font-size="14" fill="#8b949e" font-family="Segoe UI, Helvetica, Arial, sans-serif">${label}</text>
    </g>`
}

function buildSvg(scores, url) {
  const items = [
    { key: 'performance', label: 'Performance' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'bestPractices', label: 'Best Practices' },
    { key: 'seo', label: 'SEO' },
  ]
  const radius = 40
  const gap = 150
  const startX = 90
  const width = startX + gap * (items.length - 1) + 90
  const height = 250

  const gauges = items
    .map((item, i) => gauge(startX + i * gap, 150, radius, scores[item.key], item.label))
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" rx="12" fill="#0d1117" />
  <text x="30" y="45" font-size="22" font-weight="600" fill="#58a6ff" font-family="Segoe UI, Helvetica, Arial, sans-serif">🚀 PageSpeed Insights</text>
  <text x="30" y="72" font-size="14" fill="#8b949e" font-family="Segoe UI, Helvetica, Arial, sans-serif">🔗 ${url}</text>
  ${gauges}
</svg>`
}

const reportPath = findLatestReport(RESULTS_DIR)
const scores = loadScores(reportPath)
const svg = buildSvg(scores, SITE_URL)

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
fs.writeFileSync(OUTPUT_PATH, svg)
console.log(`Badge tersimpan di ${OUTPUT_PATH}`)
console.log(scores)