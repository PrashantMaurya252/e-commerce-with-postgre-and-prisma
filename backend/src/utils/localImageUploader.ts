import fs from "fs";
import path from "path";
import mime from "mime-types";

export const getRandomImagesFromFolder = (
  folderPath: string,
  count = 3
) => {
  const files = fs.readdirSync(folderPath);

  const shuffled = files.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map((fileName) => {
    const fullPath = path.join(folderPath, fileName);
    const buffer = fs.readFileSync(fullPath);

    return {
      buffer,
      originalname: fileName,
      mimetype: mime.lookup(fileName) || "image/jpeg",
    };
  });
};
