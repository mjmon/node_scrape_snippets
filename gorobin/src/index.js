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
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
// import { SpecialOfferDefault } from './models/special_offer';
dotenv_1.default.config({ path: './src/config/.env' });
// const serviceAccount = require('./config/staging_serviceAccountKey.json');
const serviceAccount = require('./config/avigate2_serviceAccount.json');
const now = firebase_admin_1.default.firestore.Timestamp.now();
const nextYear = firebase_admin_1.default.firestore.Timestamp.fromDate(getNextYearDate());
let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios_1.default.create();
console.log(`DATABASEURL: ${process.env.DATABASEURL}`);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASEURL
});
const db = firebase_admin_1.default.firestore();
//get SpecialTenants
const tenantCollection = db.collection(`Tenant`);
const scrapeAndWriteOffers = (tenantData) => __awaiter(void 0, void 0, void 0, function* () {
    const url = tenantData['offerLink'];
    //up to page 10 for now
    let pages = [...Array(5).keys()];
    try {
        Promise.all(pages.map((page) => {
            let pageUrl = `${url}&page=${page + 1}`;
            console.log(`pageUrl: ${pageUrl}`);
            AxiosInstance.get(pageUrl)
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
                    let price1Data = $(element).find('.price--compare-at > span.money').text();
                    let price2Data = $(element).find('.price--main > span.money').text();
                    // if price1 Data or price2 is empty, we are on a robinson site so we need to use different pattern
                    if (price1Data.length === 0) {
                        price1Data =
                            $(element).find('span.money.price__compare-at--single').text();
                    }
                    if (price2Data.length === 0) {
                        price2Data =
                            $(element).find('div.price__current > span').text();
                    }
                    const price1 = normalizeStringPrice(price1Data);
                    const price2 = normalizeStringPrice(price2Data);
                    console.log(`imageSrc: ${imageSrc}, price1Data: ${price1Data}, price2Data: ${price2Data}. price1: ${price1}, price2: ${price2}`);
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
                const tenantId = tenantData['docId'];
                const businessName = tenantData['businessName'];
                const address = tenantData['address'];
                const latitude = tenantData['latitude'];
                const longitude = tenantData['longitude'];
                const offerLink = tenantData['offerLink'];
                const fbId = tenantData['facebook']['id'];
                // write to firestore
                const currentTenantCollection = db.collection(`/Tenant/${tenantId}/SpecialOffers`);
                let tenantInfo = {
                    address: address,
                    allowBackorders: true,
                    businessName: businessName,
                    categoryCount: 0,
                    connections: [],
                    createDate: now,
                    docId: tenantId,
                    expireDate: now,
                    facebook: {
                        id: fbId
                    },
                    isSetupComplete: true,
                    isSpecialTenant: true,
                    latitude: latitude,
                    longitude: longitude,
                    natureOfBusiness: "Others",
                    plan: "free",
                    topCardLayer: 0,
                    undeliveredReminder: "1 hour",
                    offerLink: offerLink
                };
                allProducts.forEach((prod) => {
                    const doc = currentTenantCollection.doc();
                    const specialOffer = {
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
                        fbId: fbId,
                        imageUrl: prod === null || prod === void 0 ? void 0 : prod.image,
                        images: [prod === null || prod === void 0 ? void 0 : prod.image],
                        originalImages: [prod === null || prod === void 0 ? void 0 : prod.image],
                        originalImageUrl: prod === null || prod === void 0 ? void 0 : prod.image,
                        owner: '',
                        origPrice: prod === null || prod === void 0 ? void 0 : prod.origPrice,
                        promoPrice: prod === null || prod === void 0 ? void 0 : prod.promoPrice,
                        tenant: tenantId,
                        tenantInfo: tenantInfo
                    };
                    console.log(`specialOffer: ${specialOffer}`);
                    doc.set(specialOffer);
                });
            })
                .catch((e) => {
                console.log(`error: ${e}`);
            });
        }));
    }
    catch (e) {
        console.log(`asd: ${e}`);
    }
});
const getSpecialTenants = () => __awaiter(void 0, void 0, void 0, function* () {
    const specialTenants = yield tenantCollection.where('isSpecialTenant', "==", true)
        .get();
    // const specialTenants = await tenantCollection.where('businessName', "==", "Robinsons Department Store").get();
    //filter with facebook id
    let docs = specialTenants.docs;
    let filtered = [];
    docs.forEach((doc) => {
        if (doc.data()['facebook'] != null) {
            filtered.push(doc);
        }
    });
    return filtered;
});
const processSpecialTenants = () => __awaiter(void 0, void 0, void 0, function* () {
    let specialTenants = (yield getSpecialTenants());
    specialTenants.forEach((tenant) => {
        const tenantId = tenant.data()['docId'];
        const businessName = tenant.data()['businessName'];
        const offerLink = tenant.data()['offerLink'];
        console.log(`tenantId:  ${tenantId}, businessName: ${businessName},  offerLink: ${offerLink}`);
        const specialOfferCollection = db.collection(`/Tenant/${tenantId}/SpecialOffers`);
        //delete special offer collection to make sure its updated with new ones
        specialOfferCollection.get().then((snapshot) => {
            snapshot.forEach((doc) => {
                doc.ref.delete();
            });
        }).then((_) => {
            scrapeAndWriteOffers(tenant.data());
        }).catch((e) => {
            console.log(`processSpecialTenants: ${e}`);
        });
    });
});
processSpecialTenants();
/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price) {
    return price
        .replace("Current price", "").
        replace("₱", "").replace(",", "").trim().split("\n")[0];
}
function getNextYearDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
}
