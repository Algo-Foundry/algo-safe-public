# Setting Up Docker

## Prerequisites

[Docker Desktop](https://www.docker.com/products/docker-desktop/)

[Sentry.io for the DSN](https://sentry.io/welcome/)

[WalletConnect account for the Project ID](https://cloud.walletconnect.com/sign-in)

An updated `.env.staging` or `.env.production` file. Please copy the `.env.staging.sample` or `.env.production.sample` files to `.env.staging` or `.env.production` respectively, and update the files accordingly. For more instructions on how to fill in the environment values, please refer to [README.md](README.md#constructing-docker-containers)

## Commands

For MacOS users with make installed, you can run the following make commands. Otherwise, please run the commands directly from the [Makefile](Makefile)

### <ins>Staging</ins>

#### Building the dapp image

```
make build-staging
```

#### Starting the container

```
make start-staging
```

You should be able to view the project at [localhost:3335](http://localhost:3335/)

#### Stopping the container

```
make stop-staging
```

### <ins>Production<ins>

#### Building the dapp image

```
make build-production
```

#### Starting the container

```
make start-production
```

You should be able to view the project at [localhost:3336](http://localhost:3336/)

#### Stopping the container

```
make stop-production
```
