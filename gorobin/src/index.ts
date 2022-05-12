import axios from 'axios';
import cheerio from "cheerio";
import fs from "firebase-admin";
import dotenv from 'dotenv';
import { Timestamp } from "@firebase/firestore";
// import { SpecialOfferDefault } from './models/special_offer';
dotenv.config({path: './src/config/.env'})

// const serviceAccount = require('./config/staging_serviceAccountKey.json');
const serviceAccount = require('./config/prod_serviceAccount.json');


const now = fs.firestore.Timestamp.now();
const nextYear = fs.firestore.Timestamp.fromDate(getNextYearDate());
let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios.create();

console.log(`DATABASEURL: ${process.env.DATABASEURL}`);

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
  databaseURL:process.env.DATABASEURL
});

const db = fs.firestore();

//get SpecialTenants
const tenantCollection = db.collection(`Tenant`);

const scrapeAndWriteOffers = async (tenantData: fs.firestore.DocumentData) => {

    const url = tenantData['offerLink'];
  
    //up to page 10 for now
  let pages = [...Array(1).keys()];
  
  try {
    Promise.all(pages.map((page) => {
      let pageUrl = `${url}&page=${page+1}`;
      console.log(`pageUrl: ${pageUrl}`);
      AxiosInstance.get(pageUrl)
        .then( // Once we have data returned ...
          response => {
            const html = response.data; // Get the HTML from the HTTP request
            const $ = cheerio.load(html); // Load the HTML string into cheerio
                const allElements: cheerio.Cheerio = $(parsePattern); 
                const allProducts: Product[] = [];          
                
                allElements.each((index, element) => {
                  const name: string = $(element).find('.productitem--title > a').text().replace("/n", "").trim();
                  const imageSrc = $(element).find('a.productitem--image-link > figure').find('img').attr('src');
                  let price1Data: string = $(element).find('.price--compare-at > span.money').text();
                  let price2Data: string = $(element).find('.price--main > span.money').text();
                  
                  
                  // if price1 Data or price2 is empty, we are on a robinson site so we need to use different pattern
                  if (price1Data.length === 0) {
                    price1Data = 
                      $(element).find('span.money.price__compare-at--single').text();
                  }
                  if (price2Data.length === 0) { 
                    price2Data = 
                      $(element).find('div.price__current > span').text();
                  }

                  

                  const price1: string = normalizeStringPrice(price1Data);
                  const price2: string = normalizeStringPrice(price2Data);
                  
                  console.log(`imageSrc: ${imageSrc}, price1Data: ${price1Data}, price2Data: ${price2Data}. price1: ${price1}, price2: ${price2}`);

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
                  if (origPrice > 0 && promoPrice > 0 && imageSrc != null && allProducts.length < 5) { 
                    allProducts.push({
                        name,
                        origPrice: origPrice,
                        promoPrice: promoPrice,
                        image: `https:${imageSrc}`,
                    })
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
                  address:  address,
                  businessName: businessName,
                  docId: tenantId,
                  facebook: {
                    id: fbId
                  },
                  isSpecialTenant: true,
                  latitude: latitude,
                  longitude: longitude,
                  offerLink: offerLink
                }

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
                    imageUrl: prod?.image,
                    images: [prod?.image],
                    originalImages: [prod?.image],
                    originalImageUrl: prod?.image,
                    owner: '',
                    origPrice: prod?.origPrice,
                    promoPrice: prod?.promoPrice,
                    tenant: tenantId,
                    tenantInfo: tenantInfo
                  };
                  console.log(`specialOffer: ${specialOffer}`);
                  doc.set(specialOffer);
                })

          }
        )
        .catch((e) => {
          console.log(`error: ${e}`);
        }); 
    }));
  } catch (e) { 
    console.log(`asd: ${e}`)
  }

}



const getSpecialTenants = async () => { 
  const specialTenants = await tenantCollection.where('isSpecialTenant', "==", true)
    .get();
  // const specialTenants = await tenantCollection.where('businessName', "==", "Robinsons Department Store").get();
  //filter with facebook id

  let docs = specialTenants.docs;

  let filtered: fs.firestore.QueryDocumentSnapshot<fs.firestore.DocumentData>[] = [];

  docs.forEach((doc) => { 
    if (doc.data()['facebook'] != null) { 
      filtered.push(doc);
    }
  })
  
  return filtered;
}

const processSpecialTenants = async () => {
  let specialTenants = (await getSpecialTenants());
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
       })
    }).then((_) => { 
    scrapeAndWriteOffers(tenant.data());
    }).catch((e) => { 
      console.log(`processSpecialTenants: ${e}`);
    })

  });
}


processSpecialTenants();


/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price: string): string {
  return price
    .replace("Current price", "").
    replace("₱", "").replace(",", "").trim().split("\n")[0];
}

function getNextYearDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}