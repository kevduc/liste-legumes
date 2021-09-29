const tables = [...document.querySelector('#contenu_corps_central').querySelectorAll('table')]

const legumes = tables.map((table) => [
  table.previousElementSibling.innerText,
  [...table.rows].map((row) => [...row.cells[1].children].map((element) => element.innerText)),
])

console.log(JSON.stringify(legumes))
