# Use an official Ubuntu minimal image as a parent image
FROM --platform=linux/amd64 node:16-bullseye-slim
# FROM node:16-bullseye-slim

# Update the package manager and install some packages
RUN apt-get update && \
  apt-get install -y curl git osmium-tool unzip

ENV HOME=/home/runner
WORKDIR $HOME
COPY ./package.json $HOME/app/

WORKDIR $HOME/app
RUN yarn install

COPY ./ $HOME/app/
