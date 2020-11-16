import {Deluge} from "@ctrl/deluge";
import {Torrent} from "@ctrl/deluge/dist/types";
import {client} from "./client";
import {config} from "./config";
import {conjunctions} from "./conjunctions";
import {filters} from "./filters";
import {log} from "./log";

export class AutoRemove {

    /**
     * check if options for label or tracker, else take "all", if label and tracker, label will win
     * @param torrent
     */
    private static getRemoveRules(torrent) {
        const trackerHostWithoutDomain = torrent.tracker_host.split(".")[0];

        return config.autoremove[torrent.label] ?
                    config.autoremove[torrent.label] :
                    config.autoremove[trackerHostWithoutDomain] ?
                        config.autoremove[trackerHostWithoutDomain] :
                        config.autoremove.all ? config.autoremove.all : {};
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

    private static getShouldRemove(appliedFilterResults, removeRules) {
        if (appliedFilterResults.length === 0) {
            return false;
        }

        if (!removeRules.conjunction) {
            removeRules.conjunction = "or";
        }

        return appliedFilterResults.length === 1 ?
            appliedFilterResults[0] : conjunctions[removeRules.conjunction](appliedFilterResults);
    }

    private client: Deluge;
    private readonly test_mode: boolean;

    constructor(client: Deluge, test_mode: boolean = false) {
        this.client = client;
        this.test_mode = test_mode;
    }

    public check(torrents: {[key: string]: Torrent}) {
        if (!config.autoremove) {
            log("No autoremove options found! Returning...");
            return;
        }
        const removedTorrents = [];

        for (const[key, torrent] of Object.entries(torrents)) {
            if (AutoRemove.isNotFinished(torrent) || AutoRemove.isExempted(torrent)) { continue; }
            const removeRules = AutoRemove.getRemoveRules(torrent);
            const appliedFilterResults = AutoRemove.applyFilters(removeRules, torrent);
            const shouldRemove = AutoRemove.getShouldRemove(appliedFilterResults, removeRules);
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
                log(`Would remove: ${torrent.name} with ratio ${torrent.ratio.toFixed(3)} and seeding time of ${+torrent.seeding_time.toFixed(2)} days"`);
            } else {
                client.removeTorrent(key, removeRules.remove_data).then((result) => {
                    log(`Torrent ${torrent.name} with ratio of ${torrent.ratio.toFixed(3)} and seeding time of ${+torrent.seeding_time.toFixed(2)} days removed successfully!`);
                });
            }
            torrentRemoved = true;
        }
        return torrentRemoved;
    }
}
