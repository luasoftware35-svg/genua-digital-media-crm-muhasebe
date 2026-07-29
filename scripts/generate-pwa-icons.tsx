import React from "react";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import { AppIconMarkup } from "../src/lib/app-icon-markup";

async function generate() {
  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  for (const size of [192, 512]) {
    const response = new ImageResponse(<AppIconMarkup size={size} />, {
      width: size,
      height: size,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(join(publicDir, `icon-${size}.png`), buffer);
    console.log(`Generated public/icon-${size}.png`);
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
