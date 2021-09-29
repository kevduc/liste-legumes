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

const veggieProperties = [
  ['saison', 'saison'],
  ['taux_de_calcium', 'taux de calcium'],
  ['oxalates', 'oxalates'],
  ['ration', '(?:(?:une|1)?\\s*ration)'],
]
const veggiePropertiesRegex = new RegExp(
  `^\\s*(?:${veggieProperties
    .map(([property, regex]) => `(?<${property}>${regex})`)
    .join('|')})\\s*[:=]?\\s*(?<value>.*?)\\s*$`,
  'i'
)

const veggies = {
  listes: tables.map((table) => ({
    description: table.previousElementSibling.textContent.trim().replace(/\s*:\s*$/, ''),
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
          const matches = text.match(veggiePropertiesRegex)
          const [property, value] =
            matches !== null
              ? [
                  Object.entries(matches.groups).filter(([tag, text]) => tag !== 'value' && text !== undefined)[0][0], // get the first veggie property with a non-undefined value (should be the only one)
                  matches.groups.value,
                ]
              : ['description', text]

          vegetable[property] = vegetable[property] !== undefined ? `${vegetable[property]}\n${value}` : `${value}`
        })

      return {
        ...vegetable,
        description: vegetable.description?.split('\n'),
        saison: vegetable.saison?.split(',').map((text) =>
          text
            .trim()
            .toLowerCase()
            .replace(/(?:^|(?<=\s))eté(?:(?=\s)|$)/g, 'été')
        ),
      }
    }),
  })),
}

fs.writeFileSync(outputFile, JSON.stringify(veggies, null, 3))
