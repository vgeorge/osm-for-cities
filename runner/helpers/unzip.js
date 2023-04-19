import { execaToStdout } from "../../utils/execa.js";

export async function unzip(file, destination) {
  await execaToStdout("unzip", ["-o", file, "-d", destination]);
}
