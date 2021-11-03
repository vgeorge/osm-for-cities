import puppeteer from "puppeteer";
import { logger } from "./general.js";

/**
 * Login to Geofabrik internal server
 * @returns {string} gf_download_oauth
 */
export default async function geofabrikLogin() {
  logger("Geofabrik login...");

  // Init browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Open OSM login
  logger("Accessing OSM OAuth...");
  await page.goto("https://osm-internal.download.geofabrik.de");
  await Promise.all([
    page.$eval("p.importantLink:nth-child(4) > a:nth-child(1)", (el) =>
      el.click()
    ),
    page.waitForNavigation(),
  ]);

  // Fill form and submit
  logger("Filling OSM login form...");
  await page.$eval(
    "#username",
    (el, user) => (el.value = user),
    process.env.OSM_USERNAME
  );
  await page.$eval(
    "#password",
    (el, password) => (el.value = password),
    process.env.OSM_PASSWORD
  );
  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  // Confirm permission
  logger("Confirming permissions...");
  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  // Get cookie
  logger("Extracting auth cookie...");
  const cookies = await page.cookies();
  const gf_download_oauth_Cookie = cookies.find(
    (c) => c.name === "gf_download_oauth"
  )?.value;

  // Close browser
  await browser.close();

  if (!gf_download_oauth_Cookie) {
    throw Error("Could not login to Geofabrik");
  }

  return gf_download_oauth_Cookie;
}
