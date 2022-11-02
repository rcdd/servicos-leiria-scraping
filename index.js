import { chromium } from 'playwright';
import fs from 'fs';
import { sendMessage } from "./telegram.js";

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

async function scrapePage(page) {
    const iframe = page.frameLocator("#myframeB");
    await iframe.locator(".mynetListagem tbody tr").click();
    const status = await iframe.locator("#SITUAPROD").inputValue();
    await iframe.locator("#tabelaOrdenaVeRequerimento tbody tr").click();
    await iframe.locator("#spocir .mynetDivPresto .mynetListagem tbody tr").nth(0).click();
    const description = await iframe.locator("#spocir [id*='spocirinfodetalhe'] #codigoinf").inputValue();

    const fileName = "status.txt";
    const actualStatus = status + " -> " + description;
    let lastStatus = '';

    if (fs.existsSync(fileName)) {
        lastStatus = fs.readFileSync(fileName).toString();
    }

    if (lastStatus === '' || lastStatus !== actualStatus) {
        fs.writeFile(fileName, actualStatus, function (err) {
            if (err) return console.log(err);
            console.log("saved last status to file");
        });
        await sendMessage(status);
    } else {
        console.log("Same status");
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
    const user = process.env.USER
    const password = process.env.PASSWORD

    const help = "Ex:\n\
USER=1111111 PASSWORD=Password123 node index.js";


    if (!user || !password) {
        console.error("Needs login details\n" + help);
        return;
    }

    // while (!prize_applied) {
    await initContext(user, password);
    // }

}

await start();
