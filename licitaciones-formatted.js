const puppeteer = require('puppeteer')
const fs = require('fs/promises')
// const tabletojson = require('tabletojson').Tabletojson
// const moment = require('moment')
const { default: tableParser } = require('puppeteer-table-parser');

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

    const data = await tableParser(page, {
      selector: '#tableLicitacionesPerfilContratante',
      csvSeparator: ',',
      withHeader: false,
      allowedColNames: {
        Expediente: 'expediente',
        Tipo: 'tipo',
        'Objeto del contrato': 'objcontrato',
        Estado: 'estado',
        Importe: 'importe',
        Fechas: 'fechas'
      },
      // extraCols: [
      //   {
      //     colName: 'fechas2',
      //     data: '',
      //     position: 7
      //   },
      //   {
      //     colName: 'fechas3',
      //     data: '',
      //     position: 8
      //   },
      //   {
      //     colName: 'fechas4',
      //     data: '',
      //     position: 9
      //   },
      //   {
      //     colName: 'fechas5',
      //     data: '',
      //     position: 10
      //   }
      //   {
      //     colName: 'formalizacion',
      //     data: '',
      //     position: 9
      //   },
      //   {
      //     colName: 'presoferta',
      //     data: '',
      //     position: 10
      //   }
      //   // {
      //   //   colName: 'desestimiento',
      //   //   data: '',
      //   //   position: 11
      //   // }
      // ],
      rowTransform: (row, getColumnIndex) => {
        const fechas = getColumnIndex('fechas')
        // const fechas2 = getColumnIndex('fechas2')
        // const fechas3 = getColumnIndex('fechas3')
        // const fechas4 = getColumnIndex('fechas4')
        // const fechas5 = getColumnIndex('fechas5')

        const importe = getColumnIndex('importe')

        // const adjudicacion = getColumnIndex('adjudicacion')
        // const formalizacion = getColumnIndex('formalizacion')
        // const presoferta = getColumnIndex('presoferta')
        // const desestimiento = getColumnIndex('desestimiento')
        const objcontrato = getColumnIndex('objcontrato')

        // return row[fecha]
        row[objcontrato] = row[objcontrato].replace(/,/g, ';')
        row[importe] = row[importe].replace('.', '').replace('.', '').replace(',', '.')
        // console.log(row[fechas])
        const fechasFormatted = row[fechas].replace(/ /g, '').trim()
        row[fechas] = fechasFormatted
      }
    })
    // console.log(data)
    fs.appendFile('./nuevos_datos/licitaciones.csv', (data), (err) => {
      if (err) throw err
      console.log('The "data to append" was appended to file!')
    })
    // const selector = '#tableLicitacionesPerfilContratante tbody tr'
    // const noExpediente = await page.evaluate(
    //   () => [...document.querySelectorAll(
    //     '#tableLicitacionesPerfilContratante > tbody > tr > td')]
    //     .map(elem => elem.innerText)
    // )
    const isDisabled =
      (await page.$(
        'input[name="viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:form1:ultimoLink"]'
      )) === null

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
    // console.log(data.length)
  } // end of while

  // console.log(isBtnDisabled, 'isBtnDisabled2')

  console.log('PROCESO TERMINADO')
  browser.close()
})()
