import fs from 'fs'

import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

const outputFile = 'vegetables.json'
const inputFile = 'input.html'
const url = 'https://www.ladureviedulapinurbain.com/listelegumes.php'

let rawText = null

if (fs.existsSync(inputFile)) {
  rawText = fs.readFileSync(inputFile, 'utf8')
} else {
  rawText = await (await fetch(url)).text()
  fs.writeFileSync(inputFile, rawText)
}

const { document } = new JSDOM(rawText).window

const tables = [...document.querySelector('#contenu_corps_central').querySelectorAll('table')]

const veggies = tables.map((table) => [
  table.previousElementSibling.textContent,
  [...table.rows].map((row) => {
    const [name, ...description] = [...row.cells[1].childNodes]
      .map((node) => node.textContent ?? node.data)
      .filter((text) => !/^\s*$/.test(text))
    return [
      name,
      description.flatMap((text) =>
        text
          .trim()
          .split(/[\n\.]/)
          .map((text) => text.trim())
          .filter((text) => text.length > 0)
      ),
    ]
  }),
])

fs.writeFileSync(outputFile, JSON.stringify(veggies, null, 3))
