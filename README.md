# Pizza Edition Game Station

This repository contains the source code for the Pizza Edition game station, a modern web-based gaming platform built with Nuxt.js. The project provides a collection of free, unblocked online games that can be played directly in your browser without any downloads or installation.

## Features

- **1000+ Free Browser Games**: A vast collection of high-quality games including action, puzzle, sports, and adventure games
- **No Downloads Required**: All games run directly in your web browser
- **Full-Screen Gameplay**: Enjoy games in full-screen mode for the best experience
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Fast Performance**: Built with modern web technologies for optimal loading times
- **SEO Friendly**: Optimized for search engines with proper meta tags and structured data

# Docker Deployment for PizaGame Static Site

This directory contains the necessary files to build and run the static site using Docker.

You can find the official Docker image here: [charliex2/pizagame](https://hub.docker.com/r/charliex2/pizagame)

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

[PizaGame.com](https://pizagame.com/) is a premier destination for free, unblocked online games. Dedicated to providing a seamless gaming experience, PizaGame offers a vast collection of over 2000+ high-quality browser games that require no downloads or installation. Whether you're at school, work, or home, you can enjoy full-screen gameplay of popular titles like Drive Mad, Brain Test Tricky Puzzles, and various action, puzzle, and sports games.

Our platform is optimized for performance and accessibility, ensuring that players can dive straight into the action without restrictions. With a user-friendly interface and a constantly updated library, PizaGame is the ultimate hub for "Pizza Edition" unblocked games.

**Visit our official site:** 🔗 [Play Pizza Edition Games Unblocked | Free Full Screen | PizaGame](https://pizagame.com/)
