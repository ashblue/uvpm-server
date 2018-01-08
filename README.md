# uv-package-manager

A package manager for Unity3D. The back-end server portion of the software.

# Quickstart

DOCKER only instructions here

## Development

If you're looking to do development work and not just run the app. You'll need to do a
few extra steps.

### Running the database

* Download and install [Docker](https://www.docker.com/)
* Run MongoDB `docker-compose -f docker-compose.mongo.yml up`
  * Run `docker-compose -f docker-compose.mongo.yml up -d` if you don't want terminal logging
* When done run `docker-compose -f docker-compose.mongo.yml down` to properly shut down the database
