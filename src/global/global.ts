import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

export const channelsConfig = JSON.parse(fs.readFileSync('src/configs/channels.json', 'utf8'));

export class Global {
    static BOT_TOKEN = process.env.BOT_TOKEN || "";
    static SERVER_ID = process.env.SERVER_ID || "";
    static IS_DEV = false;
}