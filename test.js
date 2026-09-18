const axios = require("axios");

const BASE_URL = "https://partsnet.ca";

const urls = [
  `${BASE_URL}/products/12002213-thrust-bearing-kit-for-whirlpool-and-maytag-washers`,
  `${BASE_URL}/products/12002351-onespeed-drive-motor-for-whirlpool-washer`,
  `${BASE_URL}/products/12002355-fridge-thermistor-kit-by-whirlpool-maytag-amana`,
  `${BASE_URL}/products/12002799-compressor-board-kit-for-maytag-refrigerator`,
  `${BASE_URL}/products/12010030-bosch-appliance-glass-stove-cleaner`,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function test(delay) {
  console.log(`\n===== DELAY ${delay}ms =====`);

  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await axios.get(urls[i], {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
        },
      });

      console.log(
        `${i + 1}: ${response.status}`,
        "challenge:",
        response.headers["cf-mitigated"] || "no",
        "cf-ray:",
        response.headers["cf-ray"] || "no"
      );
    } catch (error) {
      console.log(
        `${i + 1}: ERROR`,
        error.code || error.message
      );
    }

    await sleep(delay);
  }
}

async function main() {
  await test(1000);
  await sleep(10000);
  await test(3000);
  await sleep(10000);
  await test(5000);
}

main();