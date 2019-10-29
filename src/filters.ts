import * as moment from "moment";

export const filters = {
    ratio: (ratio, torrent) => {
        return torrent.ratio >= ratio;
    },

    seed_time: (goalSeedingTime, torrent) => {
        const seedingTimeInDays = torrent.seeding_time / 60 / 60 / 24;
        torrent.seeding_time = seedingTimeInDays;
        return seedingTimeInDays >= goalSeedingTime;
    },

    date_added: (goalDaysSinceAdded, torrent) => {
        const daysSinceAdded = Math.abs(moment.duration(moment.unix(torrent.time_added).diff(moment.now())).asDays());
        return daysSinceAdded >= goalDaysSinceAdded;
    },
};
