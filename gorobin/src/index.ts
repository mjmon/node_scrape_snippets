import { getHtml, getTables } from "./helper/page_parser/page_parser";
import axios from 'axios';
import cheerio from "cheerio";

const axiosInstance = axios.create();

let url = "https://toysrus.gorobinsons.ph/collections/all?_=pf&tag=TRU%20RP%20GALLERIA&page=1";
let parsePattern = "html body main div#shopify-section-static-collection div.productgrid--wrapper ul.boost-pfs-filter-products.productgrid--items.products-per-row-4 li div.productitem";
const AxiosInstance = axios.create(); 

interface Product { 
    name: string;
    origPrice: number;
    promoPrice: number;
    image?: string;
}


AxiosInstance.get(url)
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
              
              allProducts.push({
                  name,
                  origPrice: origPrice,
                  promoPrice: promoPrice,
                  image: `https:${imageSrc}`,
              })
          });

          console.log(allProducts);



    }
  )
  .catch(console.error); //


/// remove peso sign, comma and extract the price only
function normalizeStringPrice(price: string): string { 
    return price.replace("₱", "").replace(",", "").trim().split("\n")[0];
}