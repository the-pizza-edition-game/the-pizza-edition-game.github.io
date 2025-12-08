# Docker Deployment for PizaGame Static Site

This directory contains the necessary files to build and run the static site using Docker.

## Prerequisites

- Docker installed on your machine.

## Building the Image

Run the following command in this directory to build the Docker image:

```bash
docker build -t pizagame-static .
```

## Running the Container

Run the following command to start the container and serve the site on port 8000:

```bash
docker run -d -p 8000:80 --name pizagame-site pizagame-static
```

After the container starts, you can access the site at: http://localhost:8000

## Stopping the Container

To stop the container:

```bash
docker stop pizagame-site
```

## Removing the Container

To remove the container:

```bash
docker rm pizagame-site
```

## About PizaGame.com

[PizaGame](https://pizagame.com/) is a premier destination for free, unblocked online games. Dedicated to providing a seamless gaming experience, PizaGame offers a vast collection of over 2000+ high-quality browser games that require no downloads or installation. Whether you're at school, work, or home, you can enjoy full-screen gameplay of popular titles like Drive Mad, Brain Test Tricky Puzzles
, and various action, puzzle, and sports games.

Our platform is optimized for performance and accessibility, ensuring that players can dive straight into the action without restrictions. With a user-friendly interface and a constantly updated library, PizaGame is the ultimate hub for "Pizza Edition" unblocked games.

**Visit our official site:** [https://pizagame.com/](https://pizagame.com/)
