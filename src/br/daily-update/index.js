const fs = require("fs-extra");
const simpleGit = require("simple-git");
const path = require("path");
const { dataPath } = require("../config");
const { parseISO, addDays } = require("date-fns");

const gitPath = path.join(dataPath, "git");
const statsFile = path.join(gitPath, "stats.json");
const initialDate = "2021-10-01Z";

module.exports = async function dailyUpdate() {
  // Init repository path
  await fs.ensureDir(gitPath);

  const git = simpleGit({ baseDir: gitPath }).init();

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
  await git
    .env({
      GIT_COMMITTER_DATE: nextDayISO,
      GIT_AUTHOR_DATE: nextDayISO,
    })
    .add("./*")
    .commit(`Status of ${nextDayISO}`);

  console.log(`Updated to ${nextDayISO}`);
};
