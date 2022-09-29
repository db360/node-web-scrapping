const puppeteer = require('puppeteer')
const fs = require('fs/promises');
// const tabletojson = require('tabletojson').Tabletojson
// const moment = require('moment')
// const { default: tableParser } = require('puppeteer-table-parser');

(async () => {
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
  await page.goto(url, { waitUntil: 'load', timeout: 0, slowMo: 500 })
  // await page.screenshot({ path: 'screenshot.png' })
  // Insertar Valor 'Marbella' y Click en buscar
  const newInputValue = 'Marbella'
  // eslint-disable-next-line no-return-assign
  await page.evaluate(
    (val) => (document.querySelector('.width28punto6em').value = val),
    newInputValue
  )
  await page.evaluate(() => {
    const xpath =
      '//*[@id="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:botonbuscar"]'
    const result = document.evaluate(xpath, document, null)

    result.iterateNext().click()
  })
  // Click en el boton de "Junta de Gobierno del Ayuntamiento de Marbella".
  const contratosLinkSelector = 'table tbody tr:nth-child(2) a'
  await page.waitForSelector(contratosLinkSelector)
  await page.click(contratosLinkSelector)

  /// Datos GENERALES DEL AYUNTAMIENTO:
  // Form SELECTOR get data

  // Click Licitaciones
  await page.waitForSelector(
    'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]'
  )
  await page.click(
    'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]'
  )

  // Table Waite for Table
  // Table SELECTORS
  let isBtnDisabled = false
  while (!isBtnDisabled) {
    await page.waitForSelector('#tableLicitacionesPerfilContratante tbody')

    const rows = await page.$$('#tableLicitacionesPerfilContratante tbody tr')

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const expediente = await row.$eval('td:nth-of-type(1)', element => element.innerText)
      const tipo = await row.$eval('td:nth-of-type(2)', element => element.innerText)
      const objetoContrato = await row.$eval('td:nth-of-type(3)', element => element.innerText.replace(/[&#,+()$~%.':*?<>{}]/g, ''))
      const estado = await row.$eval('td:nth-of-type(4)', element => element.innerText.replace(/[\n\r]/g, ' '))
      const importe = await row.$eval('td:nth-of-type(5)', element => element.innerText.replace('.', '').replace('.', '').replace(',', '.'))

      const isFechas = await row.$('td.tdFecha div:nth-child(1)') !== null
      console.log(isFechas, 'FECHAS1')
      const isFechas2 = await row.$('td.tdFecha div:nth-child(2)') !== null
      console.log(isFechas2, 'FECHAS2')
      const isFechas3 = await row.$('td.tdFecha div:nth-child(3)') !== null
      console.log(isFechas3, 'FECHAS3')
      const fechas1 = await row.$eval('td.tdFecha', element => element.innerText.replace(/[\n]/g, ' '))
      // const fechas2 = await row.$eval('td.tdFecha div:nth-child(2) span', element => element.innerText.replace(/[\n]/g, ' '))
      // const fechas3 = await row.$eval('td.tdFecha div:nth-child(3) span', element => element.innerText.replace(/[\n]/g, ' '))
      console.log(fechas1, 'FEHCAS1')
      // console.log(expediente, tipo, objetoContrato, estado, importe, fechas)
      fs.appendFile('./nuevos_datos/nuevo.csv', `${expediente},${tipo},${objetoContrato},${estado},${importe},${fechas1},\n`, (err) => {
        if (err) throw err
        console.log('The "data to append" was appended to file!')
      })
    }

    const isDisabled = (await page.$('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:ultimoLink"]')) === null
    isBtnDisabled = isDisabled
    if (!isBtnDisabled) {
      await Promise.all([
        page.click(
          'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:siguienteLink"]'
        ),
        page.waitForNavigation({ waitUntil: 'load' })
      ])
    }
    // const csvData = JSON.stringify(data)// data to add
    // fs.appendFile('results4.json', csvData.replace('][', ','), 'utf8', () => console.log('File Writed Successfully'))
  } // end of while

  // console.log(isBtnDisabled, 'isBtnDisabled2')
  console.log('PROCESO TERMINADO')
  browser.close()
})()