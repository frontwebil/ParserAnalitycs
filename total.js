const axios = require("axios");

const BASE_URL = "https://partsnet.ca";

async function main() {
  let allProducts = [];

  for (let page = 1; ; page++) {
    const url = `${BASE_URL}/collections/all/products.json?limit=250&page=${page}`;

    console.log(`Getting page ${page}...`);

    const { data } = await axios.get(url);

    if (!data.products?.length) {
      break;
    }

    allProducts.push(...data.products);

    console.log(
      `Received ${data.products.length} products | Total: ${allProducts.length}`,
    );

    if (data.products.length < 250) {
      break;
    }
  }

  console.log(`DONE. Total products: ${allProducts.length}`);
}

main();
