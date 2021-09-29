import fs from 'fs'

import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

const outputFile = 'vegetables.json'

const url = 'https://www.ladureviedulapinurbain.com/listelegumes.php'

const rawText = await (await fetch(url)).text()

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

// console.log(JSON.stringify(veggies))
fs.writeFileSync(outputFile, JSON.stringify(veggies, null, 3))
