#!/usr/bin/env node
/**
 * Firebase web config ile .env.local yazar ve admin kullanıcı oluşturur.
 * Kullanım: node scripts/apply-firebase-config.mjs
 * veya FIREBASE_CONFIG_JSON='{"apiKey":"..."}' node scripts/apply-firebase-config.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const configJson = process.env.FIREBASE_CONFIG_JSON;
const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || "umut@genuadigital.com";
const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD || "GenuaPanel2026!";

if (!configJson) {
  console.error("FIREBASE_CONFIG_JSON env gerekli");
  process.exit(1);
}

const cfg = JSON.parse(configJson);
const envLines = [
  `NEXT_PUBLIC_FIREBASE_API_KEY=${cfg.apiKey}`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${cfg.authDomain}`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${cfg.projectId}`,
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket}`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId}`,
  `NEXT_PUBLIC_FIREBASE_APP_ID=${cfg.appId}`,
];

writeFileSync(join(root, ".env.local"), envLines.join("\n") + "\n");
console.log("✓ .env.local yazıldı");

const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${cfg.apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      returnSecureToken: true,
    }),
  }
);
const data = await res.json();

if (data.localId) {
  console.log(`✓ Kullanıcı oluşturuldu: ${adminEmail}`);
} else if (data.error?.message?.includes("EMAIL_EXISTS")) {
  console.log(`✓ Kullanıcı zaten var: ${adminEmail}`);
} else {
  console.log(
    "⚠ Kullanıcı oluşturulamadı:",
    data.error?.message || "Email/Password auth Console'dan açılmalı"
  );
}

console.log("\n--- Giriş bilgileri ---");
console.log("E-posta:", adminEmail);
console.log("Şifre:", adminPassword);
console.log("Proje:", cfg.projectId);
