# uv-package-manager

A package manager for Unity3D. The back-end server portion of the software.

# Quickstart

DOCKER only instructions here

## Development

If you're looking to do development work and not just run the app. You'll need to do a
few extra steps.

### Running the database

Instead of running MongoDB and Elastic Search separately, you can run both with a simple
Docker command.

* Download and install [Docker](https://www.docker.com/)
* Spin up the database `docker-compose -f docker-compose.dev.yml up`
  * Run `docker-compose -f docker-compose.dev.yml up -d` if you don't want terminal logging
* When done run `docker-compose -f docker-compose.dev.yml down` to properly shut down the database
