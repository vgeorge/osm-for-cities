import execa from "execa";

/**
 * Wrapper function to log execa process to stdout
 * */
export default async function exec(cmd, args, options) {
  const execProcess = execa(cmd, args);
  if (!options || !options.silent) {
    execProcess.stdout.pipe(process.stdout);
    execProcess.stderr.pipe(process.stdout);
  }
  return execProcess;
}
