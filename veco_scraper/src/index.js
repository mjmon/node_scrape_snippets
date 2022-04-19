"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const page_parser_js_1 = require("./helper/page_parser/page_parser.js");
let hostname = "visayanelectric.com";
let path = "/page.html?main=clients&sub1=Service%20Interruption&sub2=DecemberSchedOutage";
let parsePattern = "html body div.wrapper div.main div.mainRight div.main_content1 div.leftside_container div.left_content";
(0, page_parser_js_1.getHtml)(hostname, path)
    .then((html) => {
    return (0, page_parser_js_1.getTables)(html, parsePattern);
})
    .then((data) => {
    console.log(`data: ${data}`);
}).catch((error) => {
    console.log(`error: ${error}`);
});
