import fs from 'fs'

import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'

const outputFile = 'vegetable-lists.json'
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

const veggieProperties = ['saison', 'taux de calcium', 'oxalates']
const veggiePropertiesRegex = new RegExp(`^\\s*(${veggieProperties.join('|')})\\s*:?(.*)`, 'i')

const veggies = {
  listes: tables.map((table) => ({
    description: table.previousElementSibling.textContent.trim().replace(/\s*:\s*/, ''),
    legumes: [...table.rows].map((row) => {
      const [name, ...info] = [...row.cells[1].childNodes]
        .map((node) => node.textContent ?? node.data)
        .filter((text) => !/^\s*$/.test(text))

      const vegetable = { nom: name }
      info
        .flatMap((text) =>
          text
            .trim()
            .split(/[\n\.]/)
            .map((text) => text.trim())
            .filter((text) => text.length > 0)
        )
        .forEach((text) => {
          const [, property, value] = text.match(veggiePropertiesRegex) ?? [, 'description', text]
          const cleanProperty = property.trim().toLowerCase().replace(/\s/g, '_')
          const cleanValue = value.trim()

          vegetable[cleanProperty] =
            vegetable[cleanProperty] !== undefined ? `${vegetable[cleanProperty]}\n${cleanValue}` : `${cleanValue}`
        })

      return {
        ...vegetable,
        description: vegetable.description?.split('\n'),
        saison: vegetable.saison?.split(',').map((text) => text.trim().toLowerCase()),
      }
    }),
  })),
}

fs.writeFileSync(outputFile, JSON.stringify(veggies, null, 3))
