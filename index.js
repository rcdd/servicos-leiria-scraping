import { chromium } from 'playwright';
import fs from 'fs';
import dotenv from 'dotenv'
import { sendMessage } from "./telegram.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function login(page, user, password) {
    const iframe = page.frameLocator("#myframeB");
    await iframe.locator('#uid_futil').fill(user)
    await iframe.locator('#pwd_futil').fill(password)
    await iframe.locator("#formNameND_bs").press('Enter');
    try {
        await page.waitForNavigation({ timeout: 15000 });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function scrapePage(page) {
    const iframe = page.frameLocator("#myframeB");
    await iframe.locator(".mynetListagem tbody tr").nth(0).click();
    const status = await iframe.locator("#SITUAPROD").inputValue();


    await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").first().waitFor();
    const process_count = await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").count();

    const process_list = [];
    for (let i = 0; i < process_count; i++) {
        const process_number = await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").nth(i).locator('td').nth(0).innerText();
        const situation = await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").nth(i).locator('td').nth(2).innerText();
        await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").nth(i).click();
        await iframe.locator("#spocir .mynetDivPresto .mynetListagem tbody tr").nth(0).click();
        let description = await iframe.locator("#spocir [id*='spocirinfodetalhe'] #codigoinf").inputValue();
        if (description === "") {
            description = "---------------";
        }
        process_list.push({ 'id': process_number, situation, description })
        // await delay(10000);
    }

    const fileName = __dirname + "/status.txt";
    let actualStatus = "";
    for (let i = 0; i < process_list.length; i++) {
        actualStatus += '👉 ' + process_list[i].id + '\n➡️ ' + process_list[i].situation + '\n⏩ ' + (process_list[i].description) + '\n\n';
    }

    // await delay(500000);
    let lastStatus = '';
    if (fs.existsSync(fileName)) {
        lastStatus = fs.readFileSync(fileName).toString();
    }

    if (lastStatus === '' || lastStatus !== actualStatus) {
        fs.writeFile(fileName, actualStatus, function (err) {
            if (err) return console.log(err);
            console.log("saved last status to file");
        });

        const message = "<b>[Serviço Leiria]</b> ⚠️ <u>Nova atualização</u> ⚠️\n" + actualStatus + "";
        await sendMessage(message);
    } else {
        console.log("Same status", actualStatus);
    }
}

async function initContext(user, password) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    const page = await context.newPage();
    await page.setViewportSize({ width: 1800, height: 1200 });
    await page.goto('https://servicosonline.cm-leiria.pt/?src=MyNetFormBD&formato=int_login&intmenu=1124&semuser=1/');

    await login(page, user, password);


    await context.addCookies([
        {
            name: "csmenuArvore",
            value: "8",
            domain: "servicosonline.cm-leiria.pt",
            path: "/"
        },
        {
            name: "cookieUltimoMenuSeleccionadoVisao360",
            value: "",
            domain: "servicosonline.cm-leiria.pt",
            path: "/"
        },
    ]);

    await page.goto('https://servicosonline.cm-leiria.pt/?src=SpoProServlet.asp&intmenu=1079&view=DadosERPLista&formato=spo_lista', { timeout: 50000 });

    await scrapePage(page)

    await browser.close();
}

async function start() {
    const user = process.env.USERNAME;
    const password = process.env.PASSWORD;

    if (!user || !password) {
        console.error("Please check your .env file\n");
        return;
    }

    await initContext(user, password);
}

// Load env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = __dirname + '/.env';
dotenv.config({ path });

await start();
