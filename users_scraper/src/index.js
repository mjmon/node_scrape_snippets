"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const cheerio_1 = __importDefault(require("cheerio"));
const getHtml = (hostname, path) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        https_1.default.get({
            hostname,
            path,
            method: "GET"
        }, (res) => {
            let html = "";
            res.on("data", function (chunk) {
                html += chunk;
            });
            res.on("end", function () {
                resolve(html);
            });
        }).on("error", (error) => {
            console.log(error);
            reject(error);
        });
    });
});
const getTables = (html) => {
    const $ = cheerio_1.default.load(html);
    const tableElements = $("html body div.wrapper div.container table.table.table-bordered");
    return tableElements;
};
// We're going to focus on the first two tables,
// which use a consistent HTML structure, 
// and ignore the other two tables:
const takeFirstTwoTables = (tables) => tables.slice(0, 2);
const getUsers = (table) => {
    const users = [];
    const $ = cheerio_1.default.load(table);
    $("tbody tr").each((_, row) => {
        row;
        users.push({
            id: Number($($(row).children()[0]).text()),
            firstName: $($(row).children()[1]).text(),
            lastName: $($(row).children()[2]).text(),
            userName: $($(row).children()[3]).text(),
        });
    });
    return users;
};
getHtml("webscraper.io", "/test-sites/tables")
    .then(getTables)
    .then(takeFirstTwoTables)
    .then((tables) => {
    let users = [];
    tables.each((_, table) => (users = users.concat(getUsers(table))));
    return users;
})
    .then((users) => console.log(users))
    .catch((error) => {
    console.log(`getHtml Error: ${error}`);
});
