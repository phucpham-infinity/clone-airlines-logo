import axios from "axios";
import { mkdir, writeFile } from "fs/promises";
import { createWriteStream } from "fs";
import { basename, join } from "path";

import { airlines } from "./data";

const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

const download_image = async (url: any, filepath: any) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    const writer = createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

export const main = async () => {
  const airlines_codes = airlines.result.map((x) => ({
    url: `https://static.tripcdn.com/packages/flight/airline-logo/latest/airline_logo/3x/${x.code.toLocaleLowerCase()}.webp`,
    code: x.code,
  }));
  const failedDownloads = [];

  try {
    const dir = join(process.cwd(), "images/3x");
    await mkdir(dir, { recursive: true });
    for (let index = 0; index < airlines_codes.length; index++) {
      const item = airlines_codes[index];
      const filename = basename(item.url);
      const filepath = join(dir, filename);
      
      const percentage = ((index + 1) / airlines_codes.length * 100).toFixed(2);
      console.log(`⬇️ Downloading ${filename} (${index + 1}/${airlines_codes.length}, ${percentage}%)...`);

      try {
        await download_image(item.url, filepath);
        console.log(`⚡⚡⚡ Downloaded ${filename}`);
      } catch (err: any) {
        console.error(`❌ Failed to download ${filename}: ${err.message}`);
        failedDownloads.push(item);
      }
      
      await delay(2000);
    }

    if (failedDownloads.length > 0) {
      const failedFilePath = join(process.cwd(), "failed_downloads.json");
      await writeFile(failedFilePath, JSON.stringify(failedDownloads, null, 2));
      console.log(`❌ Failed downloads saved to ${failedFilePath}`);
    }
  } catch (err: any) {
    console.error(`❌ Failed: ${err.message}`);
  }

  console.log("Failed downloads:", failedDownloads);
};