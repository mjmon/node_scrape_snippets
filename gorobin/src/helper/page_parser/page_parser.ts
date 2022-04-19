import axios from 'axios';
import cheerio from "cheerio";

const axiosInstance  = axios.create();

export const getHtml = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {

        axiosInstance.get(url).then(response => { 
            const html = response.data;

            resolve(html);
        }).catch(error => { 
            console.log(error);
        })
    });
}


export const getTables = (html: string, parsePattern: string): cheerio.Cheerio => {
    const $ = cheerio.load(html);
    const tableElements = $(parsePattern);
    return tableElements;
};