
# OSM git history

A platform for distributing current and past OpenStreetMap data extracts based on git.

## Getting started

Create a local folder outside the repository tree to keep git history repositories of countries (and other files). By default, a sibling folder in the repository tree named `ogh-data` will be used (`../ogh-data`). A custom path can be set usilng `OGH_DATA_PATH` environment variable.

Download the latest [OSM history PBF file](https://planet.osm.org/pbf/full-history) (preferably via [torrent](https://planet.osm.org/pbf/full-history/history-latest.osm.pbf.torrent)) to `{OGH_DATA_PATH}/history-pbf` folder and make sure it is named `history-latest.osh.pbf`.

Download [polyfiles.zip](https://www.dropbox.com/s/nvutp2fcg75fcc6/polyfiles.zip?dl=0) and expand it into `OGH_DATA_PATH` folder. These are the polyfiles used by Osmium to extract countries, regions and sub-regions.

Install dependencies:

- [Node](http://nodejs.org/) (see [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) package manager
- [Docker](https://www.docker.com/)

Activate required Node version:

```sh
nvm install
```

Install Node modules:

```sh
yarn
```

Start docker containers:

```sh
docker-compose up
```

Migrate the database:

```sh
yarn migrate
```

Generate Osmium configuration files:

```sh
yarn cli generate-osmium-config
```

Ingest daily extracts to the current day:

```sh
yarn cli ingest-daily-extract --recursive
```

Start web server:

```sh
yarn serve
```

## License

[MIT](LICENSE)
