import {Deluge} from "@ctrl/deluge";
import {Torrent} from "@ctrl/deluge/dist/types";
import {client} from "./client";
import {config} from "./config";
import {conjunctions} from "./conjunctions";
import {filters} from "./filters";

export class AutoRemove {

    /**
     * check if options for label or tracker, else take "all", if label and tracker, label will win
     * @param torrent
     */
    private static getRemoveRules(torrent) {
        return config.autoremove[torrent.label] ?
                    config.autoremove[torrent.label] :
                    config.autoremove[torrent.tracker_host] ?
                        config.autoremove[torrent.tracker_host] :
                        config.autoremove.all;
    }

    private static applyFilters(removeRules: any, torrent: Torrent) {
        const results = [];
        for (const [rule, value] of Object.entries(removeRules)) {
            if (filters[rule]) {
                results.push(filters[rule](value, torrent));
            }
        }
        return results;
    }

    private static isNotFinished(torrent) {
        return torrent.progress !== 100;
    }

    private static isExempted(torrent) {
        return config.autoremove.exemptions && (config.autoremove.exemptions[torrent.label]
            || config.autoremove.exemptions[torrent.tracker_host]);
    }

    private client: Deluge;
    private readonly test_mode: boolean;

    constructor(client: Deluge, test_mode: boolean) {
        this.client = client;
        this.test_mode = test_mode;
    }

    public check(torrents: {[key: string]: Torrent}) {
        if (!config.autoremove) { return; }
        const removedTorrents = [];

        for (const[key, torrent] of Object.entries(torrents)) {
            // console.log(torrent);
            if (AutoRemove.isNotFinished(torrent) || AutoRemove.isExempted(torrent)) { continue; }
            const removeRules = AutoRemove.getRemoveRules(torrent);
            const appliedFilterResults = AutoRemove.applyFilters(removeRules, torrent);
            const shouldRemove = appliedFilterResults.length === 1 ?
                appliedFilterResults[0] : conjunctions[removeRules.conjunction](appliedFilterResults);
            if (this.removeTorrent(shouldRemove, torrent, key, removeRules)) {
                removedTorrents.push(torrent);
            }
        }

        return removedTorrents;
    }

    private removeTorrent(shouldRemove: boolean, torrent: Torrent, key: string, removeRules: any) {
        let torrentRemoved = false;
        if (shouldRemove) {
            if (this.test_mode) {
                console.log(`Would remove: ${torrent.name} with ratio ${torrent.ratio} and seeding time of ${torrent.seeding_time} days"`);
            } else {
                client.removeTorrent(key, removeRules.remove_data).then((result) => {
                    console.log(`Torrent ${torrent.name} with ration of ${torrent.ratio} and seeding time of ${torrent.seeding_time} days removed successfully!`);
                });
            }
            torrentRemoved = true;
        }
        return torrentRemoved;
    }
}
