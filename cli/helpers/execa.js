import execa from "execa";
import { theLogger } from "./logger.js";

export async function execaToStdout(cmd, args) {
  const execProcess = execa(cmd, args);

  execProcess.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.length > 0) {
        theLogger.info(line);
      }
    });
  });

  execProcess.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach((line) => {
      if (line.length > 0) {
        theLogger.error(line);
      }
    });
  });

  return execProcess;
}
