import axios from 'axios';
import cheerio from "cheerio";
import fs from "firebase-admin";
import dotenv from 'dotenv';
import { Timestamp } from "@firebase/firestore";
// import { SpecialOfferDefault } from './models/special_offer';
dotenv.config({path: './src/config/.env'})

const serviceAccount = require('./config/serviceAccountKey.json');

console.log(`DATABASEURL: ${process.env.DATABASEURL}`);

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
  databaseURL:process.env.DATABASEURL
});

const db = fs.firestore();
      const now = fs.firestore.Timestamp.now();

//TRU RP GALLERIA

let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios.create();

let isRobinson = false;

let tag = isRobinson ? "RDS RP ERMITA" : "TRU RP GALLERIA";

//up to page 10 for now
let pages = [...Array(10).keys()];

Promise.all(pages.map((page) => {
  let url = `https://toysrus.gorobinsons.ph/collections/all?_=pf&tag=${tag}&page=${page}`;
  performScrapeAndWrite(url);
}));


function performScrapeAndWrite (url: string) { 
AxiosInstance.get(encodeURI(url))
  .then( // Once we have data returned ...
    response => {
      const html = response.data; // Get the HTML from the HTTP request
      const $ = cheerio.load(html); // Load the HTML string into cheerio
          const allElements: cheerio.Cheerio = $(parsePattern); 
          const allProducts: Product[] = [];          
          
          allElements.each((index, element) => {
              const name: string = $(element).find('.productitem--title > a').text().replace("/n", "").trim();
              const imageSrc = $(element).find('a.productitem--image-link > figure').find('img').attr('src');
              const price1Data: string = $(element).find('.price--compare-at > span.money').text();
              const price2Data: string = $(element).find('.price--main > span.money').text();

              const price1: string = normalizeStringPrice(price1Data);
              const price2: string = normalizeStringPrice(price2Data);

              let origPrice: number = 0;
              let promoPrice: number = 0;

              if (price1 === "") {
                  // if there's no discounted price display, price2 is the original price
                  // and promo is zero
                  origPrice = parseFloat(price2);
                  promoPrice = 0;
              } else { 
                  origPrice = parseFloat(price1);
                  promoPrice = parseFloat(price2);
              }
            if (origPrice > 0 && promoPrice > 0 && imageSrc != null) { 
              allProducts.push({
                  name,
                  origPrice: origPrice,
                  promoPrice: promoPrice,
                  image: `https:${imageSrc}`,
              })
            }
          });
      
      writeToFirestore(allProducts);
  
    }
  )
  .catch(console.error); 
}


function writeToFirestore(allProducts: Product[]) { 
      const robinsonTenantId = "k0DgV3qo5Rn9IFHMofME";
      const toysRusTenantId = "E1lYfBE3TcpAgO1x2cwr";
      const tenantid = toysRusTenantId;
        
      const toysRusCollection = db.collection(`/Tenant/${tenantid}/SpecialOffers`);

      let dummyTenantInfo = {
        address: "BGC Taguig",
        allowBackorders: true,
        businessName: "Toys R Us",
        categoryCount: 0,
         connections: [],
        createDate: now,
        docId: tenantid,
        expireDate: now,
        facebook: null,
        isSetupComplete: true,
        isSpecialTenant: true,
        latitude: null,
        longitude: null,
        natureOfBusiness: "Others",
        plan: "free",
        topCardLayer: 0,
        undeliveredReminder: "1 hour"
      }

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
              endDate: now,
              updateDate: now,
              fbId: null,
              imageUrl: prod?.image,
              images: [prod?.image],
              originalImages: [prod?.image],
              originalImageUrl: prod?.image,        
              owner: '',
              origPrice: prod?.origPrice,
              promoPrice: prod?.promoPrice ,
              tenant: tenantid,
              tenantInfo: dummyTenantInfo
        });
      })
}


/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price: string): string {
    return price.replace("₱", "").replace(",", "").trim().split("\n")[0];
}

