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

async function main() {
  let totalRequests = 0;

  console.log("===== 10 REQUESTS PER URL / 1s INTERVAL =====\n");

  for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
    console.log(`\n===== URL ${urlIndex + 1}/${urls.length} =====`);
    console.log(urls[urlIndex]);

    for (let requestIndex = 1; requestIndex <= 10; requestIndex++) {
      totalRequests++;

      const start = Date.now();

      try {
        const response = await axios.get(urls[urlIndex], {
          timeout: 15000,
          validateStatus: () => true,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
          },
        });

        const time = Date.now() - start;

        const challenge = response.headers["cf-mitigated"] || "no";
        const ray = response.headers["cf-ray"] || "no";

        console.log(
          `#${totalRequests} | URL ${urlIndex + 1} | request ${requestIndex}/10 | ` +
          `${response.status} | ${time}ms | ` +
          `challenge: ${challenge} | cf-ray: ${ray}`
        );

        if (
          response.status === 403 ||
          response.status === 429 ||
          challenge !== "no"
        ) {
          console.log("\n🚨 BLOCK / CHALLENGE DETECTED");
          console.log(`Total requests: ${totalRequests}`);
          console.log(`URL: ${urlIndex + 1}`);
          console.log(`Request for this URL: ${requestIndex}/10`);
          console.log(`Status: ${response.status}`);
          console.log(`Challenge: ${challenge}`);

          return;
        }
      } catch (error) {
        console.log(
          `#${totalRequests} | URL ${urlIndex + 1} | request ${requestIndex}/10 | ERROR | ${
            error.code || error.message
          }`
        );
      }

      if (requestIndex < 10) {
        await sleep(1000);
      }
    }
  }

  console.log("\n===== TEST FINISHED =====");
  console.log(`Total requests: ${totalRequests}`);
}

main();