"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getHtml_1 = require("./helper/getHtml");
let hostname = "visayanelectric.com";
let path = "/page.html?main=clients&sub1=Service%20Interruption&sub2=DecemberSchedOutage";
(0, getHtml_1.getHtml)(hostname, path).then((data) => {
    console.log(`data: ${data}`);
}).catch((error) => {
    console.log(`error: ${error}`);
});
