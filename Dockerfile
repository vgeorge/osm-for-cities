# Use an official Ubuntu minimal image as a parent image
FROM node:16-bullseye-slim

# Update the package manager and install some packages
RUN apt-get update && \
  apt-get install -y curl git osmium-tool

ENV HOME=/home/runner
WORKDIR $HOME
COPY ./ $HOME/app
WORKDIR $HOME/app

RUN yarn install
