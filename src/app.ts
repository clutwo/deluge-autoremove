import {Torrent} from "@ctrl/deluge/dist/types";
import {AutoRemove} from "./autoremove";
import {client} from "./client";
import {config} from "./config";
import {log} from "./log";

const DEFAULT_CHECK_INTERVAL = 60; // minutes
const TEST_MODE = config.credentials.test_mode || false;

const autoremover = new AutoRemove(client, TEST_MODE);

function start() {
    if (config.autoremove && config.autoremove.enabled) {
        log(`Starting autoremove module...`);
        log(JSON.stringify(config, null, 2));
        // tslint:disable-next-line:max-line-length
        const interval = config.autoremove.check_interval ? config.autoremove.check_interval * 60 * 1000 : DEFAULT_CHECK_INTERVAL * 60 * 1000;
        autoremove().then(() => {
            setInterval(autoremove, interval);
        });
    }
}

async function autoremove() {
    log("Checking torrents to see which can be removed...");
    const res = await client.listTorrents(["seeding_time"]).catch((err) => console.log(`Error retrieving torrents from client: ${err}`));
    if (res) {
        const currentTorrents: {[key: string]: Torrent} = res.result.torrents;
        log(`Found ${Object.values(currentTorrents).length} torrents in total!`);
        const removedTorrents = autoremover.check(currentTorrents);
        log(`Removed ${removedTorrents.length} torrents!`);
        return removedTorrents;
    }
}

start();
