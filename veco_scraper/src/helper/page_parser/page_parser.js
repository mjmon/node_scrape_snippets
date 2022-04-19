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
exports.getTables = exports.getHtml = void 0;
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
        });
    });
});
exports.getHtml = getHtml;
const getTables = (html, parsePattern) => {
    const $ = cheerio_1.default.load(html);
    const tableElements = $(parsePattern);
    return tableElements;
};
exports.getTables = getTables;
