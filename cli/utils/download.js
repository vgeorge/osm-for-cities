import fs from "fs-extra";
import fetch from "node-fetch";

export const downloadFile = async function (url, dest) {
  const arrayBuffer = await fetch(url).then((response) => {
    if (response.status !== 200) {
      throw `Could not download ${url}`;
    } else {
      response.arrayBuffer();
    }
  });
  await fs.writeFile(dest, Buffer.from(arrayBuffer));
};
