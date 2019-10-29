import ini from 'ini';
import fs from "fs";
let config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
export { config };