"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
// import { SpecialOfferDefault } from './models/special_offer';
dotenv_1.default.config({ path: './src/config/.env' });
const serviceAccount = require('./config/staging_serviceAccountKey.json');
console.log(`DATABASEURL: ${process.env.DATABASEURL}`);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASEURL
});
const db = firebase_admin_1.default.firestore();
const now = firebase_admin_1.default.firestore.Timestamp.now();
const nextYear = firebase_admin_1.default.firestore.Timestamp.fromDate(getNextYearDate());
//TRU RP GALLERIA
let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios_1.default.create();
let isRobinson = false;
let tag = isRobinson ? "RDS RP ERMITA" : "TRU RP GALLERIA";
//up to page 10 for now
let pages = [...Array(1).keys()];
Promise.all(pages.map((page) => {
    let url = `https://toysrus.gorobinsons.ph/collections/all?_=pf&tag=${tag}&page=${page}`;
    performScrapeAndWrite(url);
}));
function performScrapeAndWrite(url) {
    AxiosInstance.get(encodeURI(url))
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
            let origPrice = 0;
            let promoPrice = 0;
            if (price1 === "") {
                // if there's no discounted price display, price2 is the original price
                // and promo is zero
                origPrice = parseFloat(price2);
                promoPrice = 0;
            }
            else {
                origPrice = parseFloat(price1);
                promoPrice = parseFloat(price2);
            }
            if (origPrice > 0 && promoPrice > 0 && imageSrc != null) {
                allProducts.push({
                    name,
                    origPrice: origPrice,
                    promoPrice: promoPrice,
                    image: `https:${imageSrc}`,
                });
            }
        });
        writeToFirestore(allProducts);
    })
        .catch(console.error);
}
function writeToFirestore(allProducts) {
    const robinsonTenantId = "k0DgV3qo5Rn9IFHMofME";
    const toysRusTenantId = "E1lYfBE3TcpAgO1x2cwr";
    const tenantid = isRobinson ? robinsonTenantId : toysRusTenantId;
    const toysRusCollection = db.collection(`/Tenant/${tenantid}/SpecialOffers`);
    let tenantInfo = {
        address: "BGC Taguig",
        allowBackorders: true,
        businessName: isRobinson ? "Robinsons Department Store" : "Toys R Us",
        categoryCount: 0,
        connections: [],
        createDate: now,
        docId: tenantid,
        expireDate: now,
        facebook: null,
        isSetupComplete: true,
        isSpecialTenant: true,
        latitude: 14.5409,
        longitude: 121.0503,
        natureOfBusiness: "Others",
        plan: "free",
        topCardLayer: 0,
        undeliveredReminder: "1 hour"
    };
    allProducts.forEach((prod) => {
        const doc = toysRusCollection.doc();
        doc.set({
            docId: doc.id,
            isSpecialTenant: true,
            title: prod.name,
            description: '',
            connectAttempt: [],
            connections: [],
            createDate: now,
            startDate: now,
            endDate: nextYear,
            updateDate: now,
            fbId: null,
            imageUrl: prod === null || prod === void 0 ? void 0 : prod.image,
            images: [prod === null || prod === void 0 ? void 0 : prod.image],
            originalImages: [prod === null || prod === void 0 ? void 0 : prod.image],
            originalImageUrl: prod === null || prod === void 0 ? void 0 : prod.image,
            owner: '',
            origPrice: prod === null || prod === void 0 ? void 0 : prod.origPrice,
            promoPrice: prod === null || prod === void 0 ? void 0 : prod.promoPrice,
            tenant: tenantid,
            tenantInfo: tenantInfo
        });
    });
}
/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price) {
    return price.replace("₱", "").replace(",", "").trim().split("\n")[0];
}
function getNextYearDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
}
