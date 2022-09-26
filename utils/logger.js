// Wrap console.log to avoid lint errors on production code
export default function logger(message) {
  console.log(`-> ${message}`); // eslint-disable-line no-console
}
