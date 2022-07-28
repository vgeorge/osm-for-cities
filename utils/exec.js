import execa from "execa";

/**
 * Wrapper function to log execa process to stdout
 * */
export async function execWithLog(cmd, args, options) {
  const execProcess = execa(cmd, args);
  if (!options || !options.silent) {
    execProcess.stdout.pipe(process.stdout);
    execProcess.stderr.pipe(process.stdout);
  }
  return execProcess;
}
