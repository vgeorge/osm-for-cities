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

## Updating Content

At the moment only Brazil is available.

### Download areas

Brazil extract is split top to bottom with UF -> microrregion -> municipality. Boundaries area from IBGE, which can be downloaded and prepared with:

```bash
yarn download-br-area
```

## License

[MIT](LICENSE)
