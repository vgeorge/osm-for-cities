// Wrap console.log to avoid lint errors on production code
export default function logger(message) {
  console.log(`-> ${message}`); // eslint-disable-line no-console
}

export function time(key) {
  console.time(`-> ${key}`); // eslint-disable-line no-console
}

export function timeEnd(key) {
  console.timeEnd(`-> ${key}`); // eslint-disable-line no-console
}
