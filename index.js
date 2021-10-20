import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import readCachedFile from 'read-cached-file'
import { Parser } from 'json2csv'

const outputFile = 'data/vegetable-lists.json'
const inputFile = 'input.html'
const url = new URL('https://www.ladureviedulapinurbain.com/listelegumes.php')

String.prototype.capitalize = function () {
  return this.replace(/^(.)/, (c) => c.toUpperCase())
}

let rawText = await readCachedFile(inputFile, async () => await (await fetch(url.href)).text())

const { document } = new JSDOM(rawText).window

const tables = [...document.querySelector('#contenu_corps_central').querySelectorAll('table')]

const veggieProperties = [
  ['saisons', 'saison'],
  ['calcium', '(?:taux de )?calcium'],
  ['oxalates', 'oxalates'],
  ['ration', '(?:une|1)?\\s*ration'],
]

const veggiePropertiesRegex = new RegExp(
  `^\\s*(?:${veggieProperties
    .map(([property, regex]) => `(?<${property}>${regex})`)
    .join('|')})\\s*[:=]?\\s*(?<value>.*?)\\s*$`,
  'i'
)

const veggieLists = {
  listes: tables.map((table) => ({
    description: table.previousElementSibling.textContent.trim().replace(/\s*:\s*$/, ''),
    legumes: [...table.rows].map((row) => {
      const img = row.cells[0].children[0]
      const imgUrl = img !== undefined ? `${url.origin}${img.src}` : null

      const [name, ...info] = [...row.cells[1].childNodes]
        .map((node) => node.textContent ?? node.data)
        .filter((text) => !/^\s*$/.test(text))

      const vegetableTemp = { nom: name.trim().capitalize(), imgUrl }

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

          vegetableTemp[property] = vegetableTemp[property] !== undefined ? `${vegetableTemp[property]}\n${value}` : `${value}`
        })

      const vegetable = {
        ...vegetableTemp,
        description: vegetableTemp.description?.split('\n'),
        saisons: vegetableTemp.saisons?.split(/[,\/]|et|mais en particulier|mais particulièrement/).map((text) =>
          text
            .trim()
            .toLowerCase()
            .replace(/(?:^|(?<=\s))eté(?:(?=\s)|$)/g, 'été')
        ),
      }

      return vegetable
    }),
  })),
}

fs.writeFileSync(outputFile, JSON.stringify(veggieLists, null, 3))

// Convert to CSV file

const queFortesChaleursProperty = 'queFortesChaleurs'

const allVeggies = [
  ...veggieLists.listes[0].legumes,
  ...veggieLists.listes[1].legumes.map((legume) => ({ ...legume, [queFortesChaleursProperty]: true })),
].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

const csvFileName = `data/${path.basename(outputFile, path.extname(outputFile))}`

;[
  [false, false],
  [false, true],
  [true, false],
  [true, true],
].forEach(([oneLine, french]) => {
  const csv = new Parser({
    fields: ['nom', 'description', ...veggieProperties.map(([key]) => key), queFortesChaleursProperty],
    delimiter: french ? ';' : ',',
    transforms: (item) => ({
      ...item,
      description: item.description?.join(oneLine ? '. ' : '\n'),
      saisons: item.saisons?.join(', '),
    }),
  }).parse(allVeggies)

  const csvFile = `${csvFileName}${french ? '-french' : ''}${oneLine ? '-oneline' : ''}.csv`
  fs.writeFileSync(csvFile, csv)
})
