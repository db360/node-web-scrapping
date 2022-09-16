const puppeteer = require('puppeteer')
const fs = require('fs/promises')

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
  const contratosLinkSelector = 'table tbody tr:nth-child(2) a span'
  await page.waitForSelector(contratosLinkSelector)
  await page.click(contratosLinkSelector)

  /// Datos GENERALES DEL AYUNTAMIENTO:
  // Form SELECTOR get data

  // // Click Documentos
  // await page.waitForSelector('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepDocs"]')
  // await page.click('input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepDocs"]')

  // Click Licitaciones
  await page.waitForSelector(
    'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]'
  )
  await page.click(
    'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic"]'
  )

  // Table SELECTORS
  // Table HEAD DATA
  // Handler
  let isBtnDisabled = false

  while (!isBtnDisabled) {
    await page.waitForSelector('#tableLicitacionesPerfilContratante tbody')
    const contractsHandles = await page.$$(
      '#tableLicitacionesPerfilContratante tbody'
    )
    // loop through handkers
    const contratos = {
      name: 'Null',
      tipoContrato: 'Null',
      objContrato: 'Null',
      estadoContrato: 'Null',
      importeContrato: 0,
      fechaContrato: 'Null'
    }
    for (const contractHandles of contractsHandles) {
      // let importeParsed = 0
      try {
        // pass the single handle below
        contratos.name = await page.evaluate(
          (el) =>
            el.querySelector(
              '#tableLicitacionesPerfilContratante tbody tr .tdExpediente'
            ).innerText,
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Name Error')
      }
      try {
        contratos.tipoContrato = await page.evaluate(
          (el) =>
            el.querySelector(
              '#tableLicitacionesPerfilContratante tbody tr .tdTipoContrato'
            ).innerText,
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Contrato Error')
      }
      try {
        contratos.objContrato = await page.evaluate(
          (el) =>
            el
              .querySelector(
                '#tableLicitacionesPerfilContratante tbody tr .tdTipoContratoLicOC'
              )
              .innerText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ''),
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Objetivo Contrato Error')
      }
      try {
        contratos.estadoContrato = await page.evaluate(
          (el) =>
            el.querySelector(
              '#tableLicitacionesPerfilContratante tbody tr .tdEstado'
            ).innerText,
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Estado Contrato Error')
      }
      try {
        contratos.importeContrato = await page.evaluate(
          (el) =>
            el.querySelector(
              '#tableLicitacionesPerfilContratante tbody tr .tdImporte'
            ).innerText,
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Importe Error')
      }
      try {
        contratos.fechaContrato = await page.evaluate(
          (el) =>
            el
              .querySelector(
                '#tableLicitacionesPerfilContratante tbody tr .tdFecha'
              )
              .innerText.replace(/[\n\r]/g, ' '),
          contractHandles
        )
      } catch (error) {
        console.log(error, 'Fecha Error')
      }
      console.log('TERMINADO L154')
    } // End of For
    if (contratos.name !== 'Null') {
      // contratos = { name, tipoContrato, objContrato, estadoContrato, importeContrato, fechaContrato }
      // contratos.push({ name, tipoContrato, objContrato, estadoContrato, importeContrato, fechaContrato })
      // fs.appendFile('results.json', JSON.stringify(contratos), 'utf8', () => console.log('File Writed Successfully'))
      fs.appendFile(
        'results2.csv',
          `${contratos.name.replace(/,/g, '.')},${contratos.tipoContrato},${
            contratos.objContrato
          },${contratos.estadoContrato},${contratos.importeContrato},${
            contratos.fechaContrato
          }\n`,
          function (err) {
            if (err) throw err
          }
      )
    }
    console.log('TERMINADO L174')
    const waitSelec = await page.waitForSelector(
      'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:siguienteLink"]',
      { visible: true }
    )
    if (waitSelec) {
      const isDisabled =
          (await page.$(
            'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:siguienteLink"]'
          )) === null
      isBtnDisabled = isDisabled
      console.log(isBtnDisabled)
      if (!isBtnDisabled) {
        await Promise.all([
          page.click(
            'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:siguienteLink"]'
          ),
          page.waitForNavigation({ waitUntil: 'load' })
        ])
      }
    }
    // console.log(isBtnDisabled)
    console.log(contratos)
  } // End for While
  console.log('TERMINADO L199')
})()
