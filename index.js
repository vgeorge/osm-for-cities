const fs = require("fs-extra");
const simpleGit = require("simple-git");
const { contentPath, statsFile, initialDate } = require("./config");
const { parseISO, addDays, format, formatISO } = require("date-fns");

async function main() {
  // Init repository path
  await fs.ensureDir(contentPath);

  const git = simpleGit({ baseDir: contentPath });
  const status = await git.init();

  // Get next day to update
  let nextDay;
  if (!(await fs.pathExists(statsFile))) {
    nextDay = parseISO(initialDate);
  } else {
    const { lastUpdated } = await fs.readJSON(statsFile);
    nextDay = addDays(parseISO(lastUpdated), 1);
  }

  // Persist last updated day
  await fs.writeJSON(statsFile, {
    lastUpdated: nextDay,
  });

  const nextDayISO = nextDay.toISOString();
  await git()
    .env({
      GIT_COMMITTER_DATE: nextDayISO,
      GIT_AUTHOR_DATE: nextDayISO,
    })
    .add("./*")
    .commit(`Status of ${nextDay}`);
}

main();
