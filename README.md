# OSM for Cities

A platform for distributing OpenStreetMap data presets for cities.

## Requirements

- [Osmium Tool](https://osmcode.org/osmium-tool/) (v1.14.0)
- [Node](http://nodejs.org/) (see [.nvmrc](./.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) package manager
- [Docker](https://www.docker.com/)

## Getting started

### Init `.env` file

Copy `.env.example` to `.env`. The example file contains some of the environment variables that can be set to configure the platform.

### Start the git server

```sh
docker-compose up
```

This command will start a Gitea server and mount data volumes to the directory `./app-data` on your local filesystem.

### Setup Gitea

1. Access the server at <http://localhost:3000>, create an user name `runner` that will be used for updating the git repositories. Save its password on your password manager as it won't be possible to reset it on a development environment.

2. [Generate an access token](http://localhost:3000/user/settings/applications) with `write:org` and `delete_repo` scope.

3. Copy token to `GITEA_ACCESS_TOKEN` environment variable in `.env` file

### Setup command line runner (for development)

Activate required Node version, if nvm is installed:

```sh
nvm install
```

Install Node modules:

```sh
yarn
```

Fetch history file:

```sh
yarn runner fetch-full-history
```

By default this command will download a reduced version of planet file for development purposes. Please check ["Deploy to production"](#deploy-to-production) section for working with the full history file.

## License

[MIT](LICENSE)

## Build docker image

To create the Docker images and publish them to the Docker registry, we will utilize Charpress.

```sh
pip install chartpress
docker login
chartpress --push
```

Copy the docker images tag version into your config `osm-for-cities/values.yaml` file.

## Install application charts

Once you have access to your kubernetes cluster, you can install Gitea and Runner applications using helm. Make sure that you have the correct configuration in `osm-for-cities/values.develop.yaml` or `osm-for-cities/values.production.yaml` file.

## Helm install Staging

```sh
# namespace for staging will be default
# Install
helm install staging ./osm-for-cities -f ./osm-for-cities/values.yaml
# Upgrade
helm upgrade staging ./osm-for-cities -f ./osm-for-cities/values.yaml
# Delete
helm delete staging
```

## Helm install production

```sh
kubectl create namespace production
# Install
helm install prod ./osm-for-cities -f ./osm-for-cities/values.production.yaml  --namespace production
# Upgrade
helm upgrade prod ./osm-for-cities -f ./osm-for-cities/values.production.yaml  --namespace production
# Delete
helm delete prod -n production
```
