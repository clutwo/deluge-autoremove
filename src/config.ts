import ini from 'ini';
import fs from "fs";
let config = ini.parse(fs.readFileSync('/app/config/config.ini', 'utf-8'));
export { config };