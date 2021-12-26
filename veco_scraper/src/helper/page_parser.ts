import https from "https";
import cheerio from "cheerio";

export const getHtml = async (hostname: string, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        https.get({
            hostname,
            path,
            method: "GET"
        }, (res) => {
            let html = "";
            res.on("data", function(chunk) {
                html +=chunk;
            });
            res.on("end", function() {
                resolve(html);
            })
        })
    });
}


export const getTables = (html: string, parsePattern: string): cheerio.Cheerio => {
    const $ = cheerio.load(html);
    const tableElements = $(parsePattern);
    return tableElements;
};