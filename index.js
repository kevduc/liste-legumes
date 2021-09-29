const tables = [...document.querySelector('#contenu_corps_central').querySelectorAll('table')]

const legumes = tables.map((table) => [
  table.previousElementSibling.innerText,
  [...table.rows].map((row) => {
    const [name, ...description] = [...row.cells[1].childNodes]
      .map((node) => node.innerText ?? node.data)
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

console.log(JSON.stringify(legumes))
