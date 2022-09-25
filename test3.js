const puppeteer = require('puppeteer')
const fs = require('fs/promises')
// const tabletojson = require('tabletojson').Tabletojson
// const moment = require('moment')

const Globalize = require('globalize')
Globalize.load(require('cldr-data').entireSupplemental())
Globalize.load(require('cldr-data').entireMainFor('en', 'es'))
Globalize.loadTimeZone(require('iana-tz-data'));

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
    const data = await page.evaluate(() => {
      const results = []

      const items = document.querySelectorAll(
        '#tableLicitacionesPerfilContratante tbody tr'
      )
      items.forEach((item) => {
        const linkToContrato = (item.querySelector('td a'))
        console.log(linkToContrato)
        results.push({
          noExpediente: item.querySelector('td.tdExpediente').innerText,
          tipo: item.querySelector('td.tdTipoContrato').innerText,
          objetivo: item.querySelector('td.tdTipoContratoLicOC').innerText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ''),
          estado: item.querySelector('td.tdEstado').innerText,
          importe: item.querySelector('td.tdImporte').innerText,
          fecha: item.querySelector('td.tdFecha').innerText.replace(/[\n\r]/g, ' ')
        })
      })
      return (results)
    })
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
    console.log(data.length)
  } // end of while

  // console.log(isBtnDisabled, 'isBtnDisabled2')

  console.log('PROCESO TERMINADO')
  browser.close()
}
)()
