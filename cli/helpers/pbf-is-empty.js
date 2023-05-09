import fs from "fs-extra";

/**
 * PBF files are empty if they have less than 105 bytes.
 */
export default async function pbfIsEmpty(pbfPath) {
  const { size } = await fs.stat(pbfPath);
  return size <= 105;
}
