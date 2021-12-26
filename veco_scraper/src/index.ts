import { getHtml, getTables,  } from "./helper/page_parser";


let hostname = "visayanelectric.com";
let path = "/page.html?main=clients&sub1=Service%20Interruption&sub2=DecemberSchedOutage";
let parsePattern = "html body div.wrapper div.main div.mainRight div.main_content1 div.leftside_container div.left_content";

getHtml(hostname, path)
.then((html) => {
   return getTables(html, parsePattern)
})
.then((data) => {
    console.log(`data: ${data}`);
}).catch((error) => {
    console.log(`error: ${error}`)
})