import fs from "fs";
import ini from "ini";
const config = ini.parse(fs.readFileSync("/app/config/config.ini", "utf-8"));
export { config };
