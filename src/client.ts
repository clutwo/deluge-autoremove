import {Deluge} from "@ctrl/deluge";
import {config} from "./config";

const client = new Deluge({
    baseUrl: config.credentials.url,
    password: config.credentials.password
});

export { client };