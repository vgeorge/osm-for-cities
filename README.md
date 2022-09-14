
# OSM git history

Creates a git repository of daily updates for OpenStreetMap extracts.

## Getting started

Download the latest [OSM history PBF file](https://planet.osm.org/pbf/full-history) (preferably via [torrent](https://planet.osm.org/pbf/full-history/history-latest.osm.pbf.torrent)) to `./data/history` folder under the name `history-latest.osh.pbf`.

Install dependencies:

- [Node](http://nodejs.org/) (see [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) package manager

Activate required Node version:

```sh
nvm install
```

Install Node modules:

```sh
yarn
```

Start history replication task:

```sh
yarn etl replicate-history
```

Start docker containers:

```sh
docker-compose up
```

Migrate the database:

```sh
yarn migrate
```

Start daily-analysis:

```sh
yarn daily-analysis --recursive
```

Start web server:

```sh
yarn serve
```

## License

[MIT](LICENSE)
