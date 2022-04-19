"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const axiosInstance = axios_1.default.create();
let url = "https://toysrus.gorobinsons.ph/collections/all?_=pf&tag=TRU%20RP%20GALLERIA&page=1";
let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios_1.default.create();
AxiosInstance.get(url)
    .then(// Once we have data returned ...
// Once we have data returned ...
response => {
    const html = response.data; // Get the HTML from the HTTP request
    const $ = cheerio_1.default.load(html); // Load the HTML string into cheerio
    const allElements = $(parsePattern);
    const allProducts = [];
    allElements.each((index, element) => {
        const name = $(element).find('.productitem--title > a').text().replace("/n", "").trim();
        const imageSrc = $(element).find('a.productitem--image-link > figure').find('img').attr('src');
        const price1Data = $(element).find('.price--compare-at > span.money').text();
        const price2Data = $(element).find('.price--main > span.money').text();
        const price1 = normalizeStringPrice(price1Data);
        const price2 = normalizeStringPrice(price2Data);
        console.log(name, `${price1 === ""}`);
        let origPrice = 0;
        let promoPrice = 0;
        if (price1 === "") {
            origPrice = parseFloat(price2);
            promoPrice = 0;
        }
        else {
            origPrice = parseFloat(price1);
            promoPrice = parseFloat(price2);
        }
        allProducts.push({
            name,
            origPrice: origPrice,
            promoPrice: promoPrice,
            image: `https:${imageSrc}`,
        });
    });
    console.log(allProducts);
})
    .catch(console.error); //
/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price) {
    return price.replace("₱", "").replace(",", "").trim().split("\n")[0];
}
