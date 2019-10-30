import {Torrent} from "@ctrl/deluge/dist/types";
import {AutoRemove} from "./autoremove";
import {client} from "./client";
import {config} from "./config";

const DEFAULT_CHECK_INTERVAL = 60; // minutes
const TEST_MODE = config.credentials.test_mode || false;

const autoremover = new AutoRemove(client, TEST_MODE);

function start() {
    if (config.autoremove && config.autoremove.enabled) {
        console.log(`Starting autoremove module...`);
        // tslint:disable-next-line:max-line-length
        const interval = config.autoremove.check_interval ? config.autoremove.check_interval * 60 * 1000 : DEFAULT_CHECK_INTERVAL * 60 * 1000;
        autoremove().then(() => {
            setInterval(autoremove, interval);
        });
    }
}

async function autoremove() {
    console.log("Checking torrents to see which can be removed...");
    const res = await client.listTorrents(["seeding_time"]);
    const currentTorrents: {[key: string]: Torrent} = res.result.torrents;
    console.info(`Found ${Object.values(currentTorrents).length} torrents in total!`);
    const removedTorrents = autoremover.check(currentTorrents);
    console.log(`Removed ${removedTorrents.length} torrents!`);
    return removedTorrents;
}

start();
