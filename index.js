require("dotenv").config();

const axios = require("axios");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const fs = require("fs");
const FormData = require("form-data");

const BASE_URL = "https://partsnet.ca";

// =========================
// ⚙️ НАЛАШТУВАННЯ
// =========================

const MAX_RETRIES = 10;
const BATCH_SIZE = 10;
const PRODUCTS_PER_PAGE = 250;
const BACKUP_EVERY = 250;

// Часові налаштування
const REQUEST_DELAY = 300; // пауза між запитами товарів
const BATCH_DELAY = 1000; // пауза між batch
const RETRY_DELAY = 1000; // базова пауза перед retry
const REQUEST_TIMEOUT = 15000; // timeout одного HTTP-запиту

// =========================

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDateStr() {
  return new Date()
    .toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .split(".")
    .join("-");
}

async function sendToTelegram(filePath, caption) {
  try {
    const form = new FormData();

    form.append("chat_id", TG_CHAT_ID);
    form.append("caption", caption);
    form.append("document", fs.createReadStream(filePath));

    await axios.post(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendDocument`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      },
    );

    console.log(`📤 Відправлено в Telegram: ${filePath}`);
  } catch (error) {
    console.error("❌ Помилка відправки в TG:", error.message);
  }
}

function saveExcel(results, fileName) {
  const worksheet = XLSX.utils.json_to_sheet(results);

  worksheet["!cols"] = [
    { wch: 18 },
    { wch: 70 },
    { wch: 70 },
    { wch: 12 },
    { wch: 28 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  XLSX.writeFile(workbook, fileName);

  console.log(`💾 Excel збережено: ${fileName}`);

  return fileName;
}

async function requestWithRetry(url, options = {}, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, {
        ...options,
        timeout: REQUEST_TIMEOUT,
      });
    } catch (error) {
      lastError = error;

      const status = error.response?.status;

      const shouldRetry =
        status === 429 ||
        (status >= 500 && status <= 599) ||
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        !error.response;

      if (!shouldRetry || attempt === retries) {
        throw error;
      }

      const retryAfter = error.response?.headers?.["retry-after"];

      const delay = retryAfter
        ? Number(retryAfter) * 1000
        : RETRY_DELAY * attempt;

      console.log(`Retry ${attempt}/${retries} for ${url} in ${delay}ms`);

      await sleep(delay);
    }
  }

  throw lastError;
}

async function getProducts() {
  const allProducts = [];

  for (let page = 1; ; page++) {
    const url =
      `${BASE_URL}/collections/all/products.json` +
      `?limit=${PRODUCTS_PER_PAGE}&page=${page}`;

    console.log(`Getting page ${page}...`);

    const { data } = await requestWithRetry(url);

    const products = data.products || [];

    if (!products.length) break;

    allProducts.push(...products);

    console.log(
      `Received ${products.length} products | Total: ${allProducts.length}`,
    );

    if (products.length < PRODUCTS_PER_PAGE) break;
  }

  return allProducts;
}

async function getStock(product) {
  const url = `${BASE_URL}/products/${product.handle}`;

  try {
    const { data } = await requestWithRetry(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    let quantity = $(".product__inventory").text().replace(/\s+/g, " ").trim();

    if (!quantity) return null;

    if (quantity === "Out of stock") return 0;

    const lowStockMatch = quantity.match(/Low stock:\s*(\d+)\s*left/i);

    const inStockMatch = quantity.match(/(\d+)\s*in stock/i);

    if (lowStockMatch) {
      return Number(lowStockMatch[1]);
    }

    if (inStockMatch) {
      return Number(inStockMatch[1]);
    }

    return null;
  } catch (error) {
    console.log(
      `Failed: ${product.handle}`,
      error.response?.status || error.message,
    );

    return null;
  }
}

async function processInBatches(products) {
  const results = [];
  const testDate = new Date();
  const dateStr = getDateStr();

  let backupCount = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    console.log(
      `\nProcessing ${i + 1}-${Math.min(
        i + BATCH_SIZE,
        products.length,
      )} / ${products.length}`,
    );

    for (const product of batch) {
      const quantity = await getStock(product);

      const result = {
        ID: product.id,
        Title: product.title,
        Handle: product.handle,
        Quantity: quantity,
        "Test Date": testDate,
        URL: `${BASE_URL}/products/${product.handle}`,
      };

      console.log(result);

      results.push(result);

      if (results.length % BACKUP_EVERY === 0) {
        backupCount++;

        const backupName = `backup${backupCount} ${dateStr}.xlsx`;

        saveExcel(results, backupName);

        await sendToTelegram(
          backupName,
          `📦 Бекап #${backupCount} | Оброблено: ${results.length} / ${products.length} товарів`,
        );
      }

      await sleep(REQUEST_DELAY);
    }

    if (i + BATCH_SIZE < products.length) {
      console.log(`Waiting limits...`);

      await sleep(BATCH_DELAY);
    }
  }

  return results;
}

async function sendTelegramMessage(message) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TG_CHAT_ID,
        text: message,
      },
      {
        timeout: 30000,
      },
    );

    console.log(`📤 Повідомлення відправлено в Telegram`);
  } catch (error) {
    console.error("❌ Помилка відправки повідомлення в TG:", error.message);
  }
}

async function main() {
  try {
    console.log("Loading all products...\n");

    const products = await getProducts();

    console.log(`\nDONE. Total products: ${products.length}\n`);

    await sendTelegramMessage(
      `📦 Знайдено товарів: ${products.length}\n\n` +
        `🚀 Починається парсинг...\n` +
        `🕐 ${new Date().toLocaleString("uk-UA")}`,
    );

    const results = await processInBatches(products);

    const dateStr = getDateStr();

    const finalName = `final ${dateStr}.xlsx`;

    saveExcel(results, finalName);

    await sendToTelegram(
      finalName,
      `✅ Фінальний звіт | Всього товарів: ${results.length}`,
    );

    console.log(`\nFinished. Processed: ${results.length} products`);
  } catch (error) {
    console.error("Parser error:", error.response?.status || error.message);
  }
}

main();
