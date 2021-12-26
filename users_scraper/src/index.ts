import https from "https";
import cheerio from "cheerio";
import { User } from "./entities/user";



const getHtml =  async (hostname: string, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {        
        https.get(
            {
                hostname,
                path,
                method: "GET"
            },
            (res) => {
                let html = "";
                res.on("data", function (chunk) {
                    html += chunk;
                });
                res.on("end", function () {
                    resolve(html);
                });
            }
        ).on("error", (error) => {
            console.log(error);
            reject(error);
        })
    });
}


const getTables = (html: string): cheerio.Cheerio => {
    const $ = cheerio.load(html);
    const tableElements = $("html body div.wrapper div.container table.table.table-bordered");
    return tableElements;
}

// We're going to focus on the first two tables,
// which use a consistent HTML structure, 
// and ignore the other two tables:
const takeFirstTwoTables = (tables: cheerio.Cheerio): cheerio.Cheerio =>
  tables.slice(0, 2);

const getUsers = (table: cheerio.Element): User[] => {
    const users: User[] = [];
    const $ = cheerio.load(table);
    $("tbody tr").each((_, row) => {
        row
        users.push({
            id: Number($($(row).children()[0]).text()),
            firstName: $($(row).children()[1]).text(),
            lastName: $($(row).children()[2]).text(),
            userName: $($(row).children()[3]).text(),
        });
    }) 
    return users;
}

getHtml("webscraper.io", "/test-sites/tables")
    .then(getTables)
    .then(takeFirstTwoTables)
    .then((tables) => {
        let users: User[] = [];
        tables.each((_, table) => (users = users.concat(getUsers(table))));
        return users;
    })
    .then((users) => console.log(users))
    .catch((error) => {
    console.log(`getHtml Error: ${error}`);
});