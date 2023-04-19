import fetch from "node-fetch";
import { GITEA_API_KEY, GITEA_HOST_URL } from "../../config/index.js";

class GiteaClient {
  constructor() {
    this.defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add token if available
    if (GITEA_API_KEY) {
      this.defaultOptions.headers.Authorization = `token ${GITEA_API_KEY}`;
    }
  }

  getUrl(subpath) {
    return `${GITEA_HOST_URL}/api/v1/${subpath}`;
  }

  async fetch(method, path, data, format = "json") {
    const url = this.getUrl(path);
    const options = {
      ...this.defaultOptions,
      method,
      format,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Fetch data and let errors to be handle by the caller
    return fetch(url, options);
  }

  get(path, format = "json") {
    return this.fetch("GET", path, null, format);
  }

  post(path, data) {
    return this.fetch("POST", path, data);
  }

  patch(path, data) {
    return this.fetch("PATCH", path, data);
  }

  delete(path) {
    return this.fetch("DELETE", path);
  }
}

export default GiteaClient;
