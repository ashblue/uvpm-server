# uv-package-manager

A package manager for Unity3D. The back-end server portion of the software.

# Quickstart

DOCKER only instructions here

## Docker

Install [Docker](https://www.docker.com) if you haven't already. This is meant for
previewing the UVPM server and not developing on it.

```bash
docker-compose up -d

# Run this when finished, shuts down the server and services
docker-compose down
```

## Development

If you're looking to do development work and not just run the app. You'll need to do a
few extra steps.

* Go through the below section to start the databases
* When complete run `npm run start`

### Running the database

Instead of running MongoDB and Elastic Search separately, you can run both with a simple
Docker command.

* Download and install [Docker](https://www.docker.com/)
* Spin up the database `docker-compose -f docker-compose.dev.yml up`
  * Run `docker-compose -f docker-compose.dev.yml up -d` if you don't want terminal logging
* When done run `docker-compose -f docker-compose.dev.yml down` to properly shut down the database

# Supported environmental variables

* NODE_ENV: Generall to run inproduction mode `NODE_ENV=production`
* TEST: `true` or `false` to set the test mode
* DB_URL: Set the current database URL for MongoDB to connect to
* JWT_SECRET: Set your JWT secret key

# Commands

## How to create a user

```bash
# Optional if you haven't built out the project yet
npm run build

npm run create-user
```

## Testing

Run all tests and automatically re-run all tests when a file changes.

```bash
npm run test
```

Run all tests once.

```bash
npm run test:single
```

Run a single test file with watch. Auto reloads when changing files.

```bash
npm run test:file -- src/app/app.spec.ts
```
