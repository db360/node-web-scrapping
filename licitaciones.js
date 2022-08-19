// const { chromium } = require('playwright');

import puppeteer from 'puppeteer'
import fs from 'fs/promises'

(async () => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('https://contrataciondelestado.es/wps/portal/')
    // await page.screenshot({ path: 'screenshot.png' })
    const cookies = await page.cookies()
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2))
    const cookiesString = await fs.readFile('./cookies.json')
    const parsedcookies = JSON.parse(cookiesString)
    await page.setCookie(...parsedcookies)
    await page.goto(
      'https://contrataciondelestado.es/wps/portal/perfilContratante',
      { waitUntil: 'networkidle0' }
    )
    const title = await page.$eval('#contenidoBuscador', element => element.innerHTML)
    await fs.writeFile('./htmlContent.html', title)
    const input = await page.$eval('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:texoorgano', el => el.textContent)
    // await page.evaluate(() => {
    //   const email = document.getElementById('#viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:texoorgano')
    //   email.value = 'marbella'
    // })
    // const input = await page.waitForTimeout(
    //   'input[name=viewns_Z7_AVEQAI930GRPE02BR764FO30G0_:listaperfiles:texoorgano]'
    // )
    // await page.screenshot({ path: 'screenshot2.png' })
    console.log(parsedcookies)
    console.log(title)
    console.log(input)
    await browser.close()
  } catch (error) {
    console.log(error)
  }
})()
