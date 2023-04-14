import fetch from "node-fetch";

const giteaHostUrl = process.env.OGH_GITEA_HOST_URL;
const giteaApiKey = process.env.OGH_GITEA_API_KEY;

class GiteaClient {
  constructor() {
    this.defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Add token if available
    if (giteaApiKey) {
      this.defaultOptions.headers.Authorization = `token ${giteaApiKey}`;
    }
  }

  getUrl(subpath) {
    return `${giteaHostUrl}/api/v1/${subpath}`;
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
