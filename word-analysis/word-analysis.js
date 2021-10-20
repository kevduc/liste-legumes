import fs from 'fs'
import readCachedFile from 'read-cached-file'

const Files = {
  VeggieLists: `../data/vegetable-lists.json`,
  StopWords: './node_modules/stopwords-fr/stopwords-fr.json',
  AllDescriptions: `all-descriptions.txt`,
  CleanWords: `cleaned-description-words.json`,
  WordCount: `word-count.json`,
}

const veggieLists = JSON.parse(fs.readFileSync(Files.VeggieLists, 'utf8'))

const allVeggies = [...veggieLists.listes[0].legumes, ...veggieLists.listes[1].legumes]

// Check seasons values are all correct

checkSeasons()

function checkSeasons() {
  const seasonRegex = /^printemps|été|automne|hiver|toute l'année$/
  console.table(
    allVeggies
      .map((veggie) => veggie.saisons?.map((saison) => [saison, seasonRegex.test(saison)]))
      .filter((tests) => tests?.some(([, result]) => result === false))
  )
}

// Description text analysis

const allDescriptions = await readCachedFile(Files.AllDescriptions, () =>
  allVeggies
    .filter(({ description }) => description !== undefined)
    .map(({ description }) => description.join(', '))
    .join('\n')
)

// Clean word set

const words = JSON.parse(
  await readCachedFile(
    Files.CleanWords,
    () => {
      const stopWords = JSON.parse(fs.readFileSync(Files.StopWords, 'utf8'))
      const stopWordsRegex = new RegExp(`^(?:${stopWords.join('|')})$`, 'i')

      const words = allDescriptions
        .split(/[\s,\(\)'\":!?\.]/)
        .filter((word) => word.length > 0)
        .map((word) => word.toLowerCase())
        .filter((word) => !stopWordsRegex.test(word))

      return JSON.stringify(words)
    },
    true
  )
)

// Count words

const wordCount = JSON.parse(
  await readCachedFile(
    Files.WordCount,
    () => {
      let wordCount = {}

      for (let i = 0; i < words.length; i++) {
        wordCount[words[i]] = (wordCount[words[i]] ?? 0) + 1
      }

      wordCount = Object.entries(wordCount).sort((a, b) => b[1] - a[1])

      return JSON.stringify(wordCount)
    },
    true
  )
)
