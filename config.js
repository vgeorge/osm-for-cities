const path = require('path');

const basePath = path.join(__dirname);
const contentPath = path.join(basePath, '..', 'content');
const statsFile = path.join(contentPath, 'stats.json');

module.exports = {
  contentPath,
  statsFile,
  initialDate: '2021-10-01Z',
};
