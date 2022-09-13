const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, waitUntil: 'load', timeout: 0, slowMo: 250 })
  const page = await browser.newPage()
  const navigationPromise = page.waitForNavigation()

  await page.goto('https://contrataciondelestado.es/wps/portal/perfilContratante')

  await page.setViewport({ width: 1388, height: 859 })

  await page.waitForSelector('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:texoorgano')
  await page.click('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:texoorgano')

  await page.waitForSelector('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:botonbuscar')
  await page.click('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:botonbuscar')

  await navigationPromise

  await page.waitForSelector('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:enlaceExpedienteBP_1_textoEnlace')
  await page.click('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:enlaceExpedienteBP_1_textoEnlace')

  await navigationPromise

  await page.waitForSelector('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic')
  await page.click('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:perfilComp:linkPrepLic')

  await navigationPromise

  await browser.close()
})()
