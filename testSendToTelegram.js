require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const XLSX = require("xlsx");
const fs = require("fs");

const TG_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendToTelegram(filePath, caption) {
  const form = new FormData();
  form.append("chat_id", TG_CHAT_ID);
  form.append("caption", caption);
  form.append("document", fs.createReadStream(filePath));

  await axios.post(
    `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendDocument`,
    form,
    { headers: form.getHeaders(), timeout: 30000 },
  );
}

async function test() {
  console.log("🔍 Перевірка змінних середовища...");

  if (!TG_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN не задано");
    process.exit(1);
  }

  if (!TG_CHAT_ID) {
    console.error("❌ TELEGRAM_CHAT_ID не задано");
    process.exit(1);
  }

  console.log("✅ Змінні є");
  console.log(`   BOT_TOKEN: ${TG_BOT_TOKEN.slice(0, 8)}...`);
  console.log(`   CHAT_ID:   ${TG_CHAT_ID}`);

  // --- Перевірка бота ---
  console.log("\n🤖 Перевірка бота...");
  const botRes = await axios.get(
    `https://api.telegram.org/bot${TG_BOT_TOKEN}/getMe`,
  );
  console.log(`✅ Бот: @${botRes.data.result.username}`);

  // --- Тестове повідомлення ---
  console.log("\n📨 Відправка тестового повідомлення...");
  await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    chat_id: TG_CHAT_ID,
    text: "✅ Тест: бот працює і може писати в канал",
  });
  console.log("✅ Повідомлення відправлено");

  // --- Тестовий Excel ---
  console.log("\n📊 Створення тестового Excel...");
  const testData = [
    {
      ID: 1,
      Title: "Test Product 1",
      Handle: "test-product-1",
      Quantity: 10,
      URL: "https://partsnet.ca/products/test-product-1",
    },
    {
      ID: 2,
      Title: "Test Product 2",
      Handle: "test-product-2",
      Quantity: 0,
      URL: "https://partsnet.ca/products/test-product-2",
    },
    {
      ID: 3,
      Title: "Test Product 3",
      Handle: "test-product-3",
      Quantity: null,
      URL: "https://partsnet.ca/products/test-product-3",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(testData);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 30 },
    { wch: 12 },
    { wch: 50 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "test.xlsx");
  console.log("✅ Excel створено");

  // --- Відправка файлу ---
  console.log("\n📤 Відправка Excel в Telegram...");
  await sendToTelegram("test.xlsx", "📎 Тестовий файл — все працює!");
  console.log("✅ Файл відправлено");

  // --- Прибираємо файл ---
  fs.unlinkSync("test.xlsx");

  console.log("\n🎉 Всі перевірки пройдено успішно!");
}

test().catch((err) => {
  console.error("\n❌ Помилка:", err.response?.data || err.message);
  process.exit(1);
});
