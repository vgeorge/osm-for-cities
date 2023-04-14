# Deploying with Kubernetes

These are instructions for deploying a local Kubernetes cluster. It is intended to be a reference for hosted deployments.

## Build OGH Runner image

Start a local docker registry at port 5000:

```sh
docker run -d -p 5000:5000 --name registry registry:2
```

Build OGH Runner image:

```sh
docker build -t ogh-runner:v1 .
```

Push it to the local registry:

```sh
docker tag ogh-runner:v1 localhost:5000/ogh-runner:v1
docker push localhost:5000/ogh-runner:v1
```

## Initialize a cluster

Create a local cluster with [minikube](https://minikube.sigs.k8s.io/docs/start/) or [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/).

From the repository root, apply configuration available in this folder:

```sh
kubectl apply -f ./kubernetes --recursive
```

## Setup Gitea

Steps:

- Access http://localhost:3000
- Create a admin user
- Create target repository
- Generate API key
- Add repository URL and API key as kubernetes secrets
