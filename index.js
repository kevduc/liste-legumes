const tables = [...document.querySelector('#contenu_corps_central').querySelectorAll('table')]

const legumes = tables.map((table) => [
  table.previousElementSibling.innerText,
  [...table.rows].map((row) => {
    const [name, description] = [...row.cells[1].children].map((element) => element.innerText)
    return [name, description.replace(/^\n/, '').split('\n')]
  }),
])

console.log(JSON.stringify(legumes))
