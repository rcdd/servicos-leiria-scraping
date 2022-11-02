import fetch, { blobFromSync, FormData } from "node-fetch";
import dotenv from 'dotenv'

dotenv.config({ path: './.env' });
const URL = 'https://api.telegram.org/bot';
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = 600713700;

export async function sendMessage(message) {
    const url = URL + TOKEN + '/sendMessage?chat_id=' + CHAT_ID + '&text=' + encodeURI(message) + '&parse_mode=html';

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Error! status: ${ response.status }`);
            console.dir(await response.json());
            process.exit(2);
        }

        const result = await response.json();
        console.dir(result);
        console.log("Done");
    } catch (err) {
        console.log(err);
    }
}

export async function sendPhoto(prize, user) {
    const url = URL + TOKEN + '/sendPhoto';
    const img = blobFromSync("screens/" + user + "/final_" + prize + ".png", 'image/png')

    try {
        const form = new FormData();
        form.append("photo", img);
        form.append("chat_id", CHAT_ID);
        form.append("caption", "Screen confirmation of " + user + ", getting " + prize);

        const response = await fetch(url, { method: "POST", body: form });

        if (!response.ok) {
            console.error(`Error! status: ${ response.status }, response:`);
            console.dir(await response.json());
            process.exit(2);
        }

        const result = await response.json();
        console.dir(result);
        console.log("Done");
    } catch (err) {
        console.log(err);
    }
}
