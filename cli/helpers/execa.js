import execa from "execa";
import { logger } from "./logger.js";

export async function execaToStdout(cmd, args) {
  const execProcess = execa(cmd, args);

  execProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.length > 0) {
        logger.info(line);
      }
    });
  });

  execProcess.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.length > 0) {
        logger.error(line);
      }
    });
  });

  return execProcess;
}
