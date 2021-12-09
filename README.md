
# OSM git history

Creates a git repository of daily updates for OpenStreetMap extracts.

## Getting started

Install dependencies:

- [Node](http://nodejs.org/) (see [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) package manager

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```sh
nvm install
```

Install Node modules:

```sh
yarn
```

### Setup OSM access

This project relies on [Geofabrik extracts](https://download.geofabrik.de) to generate datasets, an OpenStreetMap account is needed. Username and password can be passed as environment variables `OSM_USERNAME` and `OSM_PASSWORD` or by add an `.env` at root repository directory based on [.env.example](.env.example).

## Download boundaries

```bash
yarn download-boundaries
```

## Serve content locally

```bash
yarn serve
```

This will start a server at <http://localhost:2000>.
## License

[MIT](LICENSE)
