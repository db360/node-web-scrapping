// const { chromium } = require('playwright');
const puppeteer = require('puppeteer')
const fs = require('fs/promises');

// const { scrapTable } = require('./puppeteer-table-scraper');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: './tmp'
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 1080 })
    await page.goto('https://contrataciondelestado.es/wps/portal/')
    const cookies = await page.cookies()
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2))
    const cookiesString = await fs.readFile('./cookies.json')
    const parsedcookies = JSON.parse(cookiesString)
    await page.setCookie(...parsedcookies)
    const url = 'https://contrataciondelestado.es/wps/portal/perfilContratante'
    // Pagina Perfil Contratante
    await page.goto(
      url,
      { waitUntil: 'load', timeout: 0, slowMo: 250 }
    )
    // await page.screenshot({ path: 'screenshot.png' })
    // Insertar Valor 'Marbella' y Click en buscar
    const newInputValue = 'Marbella'
    // eslint-disable-next-line no-return-assign
    await page.evaluate(val => document.querySelector('.width28punto6em').value = val, newInputValue)
    await page.evaluate(() => {
      const xpath = '//*[@id="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:botonbuscar"]'
      const result = document.evaluate(xpath, document, null)

      result.iterateNext().click()
    })
    // Click en el boton de "Junta de Gobierno del Ayuntamiento de Marbella".
    const contratosLinkSelector = 'table tbody tr:nth-child(1) a '
    await page.waitForSelector(contratosLinkSelector)
    await page.click(contratosLinkSelector)

    /// Datos GENERALES DEL AYUNTAMIENTO:
    // Form SELECTOR get data

    // // Click Documentos
    // await page.waitForSelector('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepDocs"]')
    // await page.click('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepDocs"]')

    // Click Licitaciones
    await page.waitForSelector('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]')
    await page.click('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]')

    // Table SELECTOR
    await page.waitForSelector('table tr td')
    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('table tr td'))
      return tds.map(td => td.innerText)
    })
    console.log(JSON.stringify(data))
    // // GET HTML
    // await fs.writeFile('./htmlContent.html', data)
    // console.log(data)

    // const tableSelector = '#tableLicitacionesPerfilContratante'
    // scrapTable(url, tableSelector)
    // const title = await page.$eval('#anchoMinimoPLACE', element => element.innerHTML)

    // console.log(parsedcookies)
  } catch (error) {
    console.log(error)
  }
})()
