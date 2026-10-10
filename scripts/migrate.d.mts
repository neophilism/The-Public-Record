import type {Client} from "pg";
export declare function runMigrations(client:Client,directory?:string):Promise<string[]>;
