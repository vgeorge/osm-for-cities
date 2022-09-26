import fs from "fs-extra";
import fetch from "node-fetch";

export const downloadFile = async function (url, dest) {
  const arrayBuffer = await fetch(url).then((response) =>
    response.arrayBuffer()
  );
  await fs.writeFile(dest, Buffer.from(arrayBuffer));
};
