// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig, // <-- ปิดกฎที่ขัดกับ Prettier ต้องอยู่ท้ายสุด
  {
    // การตั้งค่าเพิ่มเติมสำหรับโปรเจกต์ของคุณ
    ignores: ["dist", "drizzle", "node_modules"],
    rules: {
      // สามารถเพิ่มกฎที่ต้องการได้ที่นี่
      // e.g., "@typescript-eslint/no-explicit-any": "off",
    },
  }
);