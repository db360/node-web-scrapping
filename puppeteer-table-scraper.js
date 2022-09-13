const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function scrapTable (url, tableSelector, headless = true, resultType = 'array') {
  console.log(url)
  // puppeteer settings
  const browser = await puppeteer.launch({
    headless,
    args: [
      '--start-maximized' // you can also use '--start-fullscreen'
    ]
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })
  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 0
  })
  try {
    const element = await page.$(tableSelector)
    let HTML = await page.evaluate((el) => el.innerHTML, element)
    HTML = '<table>' + HTML + '</table>'
    const $ = cheerio.load(HTML)

    const trs = $('tr')
    let header = []
    let colspan = []
    let index = 0
    let maxRowspan = 0

    while (index < trs.length) {
      const tr = trs[index]
      index++
      if (!tr) continue

      const columnNames = $(tr).children()
      const tempHead = []
      const tempColspan = []
      for (let i = 0; i < columnNames.length; i++) {
        const col = $(columnNames[i])
        tempHead.push(col.text().trim().replace(/[^a-zA-Z0-9]/g, '_'))
        tempColspan.push(Number(col.attr('colspan')) ? Number(col.attr('colspan')) : 1)
        maxRowspan = col.attr('rowspan') ? Math.max(maxRowspan, Number(col.attr('rowspan'))) : maxRowspan
      }

      header.push(tempHead)
      colspan.push(tempColspan)

      if (tempColspan.length !== 0 && tempColspan.every(x => x === 1)) {
        break
      }
    }

    header = header.filter(x => x.length !== 0)
    colspan = colspan.filter(x => x.length !== 0)

    for (let i = colspan.length - 1; i >= 0; i--) {
      // first for loop
      const tempArray = []
      let k = 0

      for (let j = 0; j < colspan[i].length; j++) {
        // second for loop
        if (colspan[i][j] === 1) {
          tempArray.push(header[i][j])
        } else {
          while (colspan[i][j] !== 0) {
            colspan[i][j] -= 1
            tempArray.push(`${header[i][j]}_${header[i + 1][k]}`)
            k++
          }
        }
      } // end of second for loop
      header[i] = tempArray
    } // end of first for loop

    const headerKeys = header[0]
    console.log(maxRowspan)
    if (index < maxRowspan) index = maxRowspan
    // ....................................
    // getting actual data from the table
    // ...................................
    let actualData = []
    while (index < trs.length) {
      const tr = trs[index]
      index++
      // const tds = $(tr).find('td');
      const tds = $(tr).children()
      const rowData = Array.from(tds, td => {
        const tdText = $(td).text().trim()
        if (isNumeric(tdText)) {
          return Number(tdText)
        }
        return tdText
      })
      const obj = {}
      rowData.forEach((data, i) => {
        obj[headerKeys[i]] = data
      })
      actualData.push(obj)
    }

    actualData = actualData.filter(x => Object.keys(x).length >= headerKeys.length - 2)
    browser.close()

    if (resultType === 'json') {
      actualData = JSON.stringify(actualData, null, 2)
    } else if (resultType === 'csv') {
      actualData = csvConverter(actualData)
    }
    return { headerKeys, resultData: actualData }
  } catch (err) {
    browser.close()
    console.log(err.message)
  }
}

function csvConverter (data) {
  if (typeof data === 'string') data = JSON.parse(data)
  let csvString = ''
  const header = Object.keys(data[0])
  csvString += header.join(',') + '\r\n'
  for (let i = 0; i < data.length; i++) {
    let line = ''
    const obj = data[i]
    const objValues = Object.values(obj)
    if (objValues.length < header.length) continue
    line = objValues.join(',')
    csvString += line + '\r\n'
  }
  return csvString
}

function isNumeric (value) {
  return /^-?\d+$/.test(value)
}

module.exports = {
  scrapTable,
  csvConverter,
  isNumeric
}
