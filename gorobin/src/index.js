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
const serviceAccount = require('./config/serviceAccountKey.json');
console.log(`DATABASEURL: ${process.env.DATABASEURL}`);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASEURL
});
const db = firebase_admin_1.default.firestore();
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
        allProducts.push({
            name,
            origPrice: origPrice,
            promoPrice: promoPrice,
            image: `https:${imageSrc}`,
        });
    });
    console.log(allProducts);
    const robinsonTenant = "k0DgV3qo5Rn9IFHMofME";
    const jjshopTenant = "U9U1BbdULKZHJGI4iFUG";
    const tenant = jjshopTenant;
    const robinsonsOffersCollection = db.collection(`/Tenant/${tenant}/SpecialOffers`);
    const doc = robinsonsOffersCollection.doc();
    const prod5 = allProducts.at(5);
    // fs.firestore.FieldValue.serverTimestamp()
    // const now = Timestamp.now().toDate;
    const now = firebase_admin_1.default.firestore.Timestamp.now();
    // Timestamp.fromDate(new Date());
    doc.set({
        docId: doc.id,
        isSpecialTenant: true,
        title: prod5 === null || prod5 === void 0 ? void 0 : prod5.name,
        description: '',
        connectAttempt: [],
        connections: [],
        createDate: now,
        startDate: now,
        endDate: now,
        updateDate: now,
        fbId: null,
        imageurl: prod5 === null || prod5 === void 0 ? void 0 : prod5.image,
        images: [prod5 === null || prod5 === void 0 ? void 0 : prod5.image],
        originalImages: [prod5 === null || prod5 === void 0 ? void 0 : prod5.image],
        originalImageUrl: prod5 === null || prod5 === void 0 ? void 0 : prod5.image,
        owner: 'JJ Shop',
        origPrice: 500,
        promoPrice: 400,
        tenant: tenant,
        tenantInfo: null,
    });
})
    .catch(console.error); //
/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price) {
    return price.replace("₱", "").replace(",", "").trim().split("\n")[0];
}
