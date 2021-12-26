import { getHtml } from "./helper/getHtml";


let hostname = "visayanelectric.com";
let path = "/page.html?main=clients&sub1=Service%20Interruption&sub2=DecemberSchedOutage";


getHtml(hostname, path).then((data) => {
    console.log(`data: ${data}`);
}).catch((error) => {
    console.log(`error: ${error}`)
})