const axios = require("axios");

const urls = [
  "https://partsnet.ca/products/00152770-axis-part-for-refrigerator",
  "https://partsnet.ca/products/00311580-premium-appliance-dishwasher-cleaner",
  "https://partsnet.ca/products/00312111-heat-pump-dryer-maintenance-part",
  "https://partsnet.ca/products/00312503-coffee-maker-cleaning-tablets-pack-of-20",
  "https://partsnet.ca/products/00312524-quick-descaler-for-washers-and-dishwashers",
  "https://partsnet.ca/products/00413552-bosch-thermador-gaggenau-oven-grate-foot-kit",
  "https://partsnet.ca/products/00422201-dryer-leveling-foot-replacement-part",
  "https://partsnet.ca/products/00499011-whirlpool-refrigerator-bracket-part",
  "https://partsnet.ca/products/00643356-dryer-handle-replacement-part",
  "https://partsnet.ca/products/00747819-dishwasher-control-unit-replacement-part",
  "https://partsnet.ca/products/10003015-silicone-rubber-foot-for-oven-range-with-spno-311504",
  "https://partsnet.ca/products/12001413-washer-strainer-and-kit-for-laundry-appliances",
  "https://partsnet.ca/products/12001541-dryer-drum-roller-for-maytag-amana-whirlpool",
  "https://partsnet.ca/products/12001656-oven-temp-sensor-for-maytag-jennair-amana",
  "https://partsnet.ca/products/12001676-oven-range-element-receptacle-kit-by-whirlpool",
  "https://partsnet.ca/products/12001788-whirlpool-washer-belt-and-isolator-kit",
  "https://partsnet.ca/products/12001807-drain-hose-kit-for-whirlpool-washer",
  "https://partsnet.ca/products/12001908-lid-switch-kit-for-whirlpool-and-maytag-washers",
  "https://partsnet.ca/products/12001930-dispenser-valve-assembly-for-whirlpool-washer",
  "https://partsnet.ca/products/12001937-defrost-thermostat-kit-for-whirlpool-fridge",
  "https://partsnet.ca/products/12001957-whirlpool-crisper-shelf-support-kit",
  "https://partsnet.ca/products/12001997-whirlpool-refrigerator-overload-relay-kit",
  "https://partsnet.ca/products/12002022-lip-seal-kit-for-whirlpool-washer",
  "https://partsnet.ca/products/12002041-whirlpool-fridge-evaporator-replacement-kit",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
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

      console.log(`${i + 1}/${urls.length} - ${response.status} - ${urls[i]}`);
    } catch (error) {
      console.log(
        `${i + 1}/${urls.length} - ERROR - ${urls[i]} - ${
          error.code || error.message
        }`,
      );
    }

    await sleep(500);
  }
}

main();
