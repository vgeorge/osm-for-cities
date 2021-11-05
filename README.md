# OSM git history

Creates a daily versioned repository of OSM data using the file system and git.

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
yarn install
```

### Setup OSM access

This project relies on [Geofabrik extracts](https://download.geofabrik.de) to generate datasets and an OpenStreetMap account is needed. Username and password can be passed as environment variables `OSM_USERNAME` and `OSM_PASSWORD` or by add an `.env` at root repository directory based on [.env.example](.env.example).

## Updating Content

At the moment only Brazil is available.

### Download areas

Brazil extract is split top to bottom with UF -> microrregion -> municipality. Boundaries area from IBGE, which can be downloaded and prepared with:

```bash
yarn download-br-area
```

## Serve content locally

```bash
yarn serve
```

This will start a server at <http://localhost:2000>.
## License

[MIT](LICENSE)
