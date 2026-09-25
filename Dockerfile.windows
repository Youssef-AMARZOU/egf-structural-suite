# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Tauri v2 desktop app (Windows cross-build)
# Build: docker build -t egf-structural-suite .
# Output: Windows .exe installer

FROM node:20-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY src/ src/
COPY index.html vite.config.ts tailwind.config.js postcss.config.js tsconfig*.json ./
RUN npx vite build

FROM rust:1.81-bookworm AS backend
WORKDIR /app
COPY src-tauri/ src-tauri/
COPY --from=frontend /app/dist src-tauri/../dist
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
    librsvg2-dev patchelf && rm -rf /var/lib/apt/lists/*
RUN cd src-tauri && cargo build --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
    librsvg2-dev && rm -rf /var/lib/apt/lists/*
COPY --from=backend /app/src-tauri/target/release/egf-structural-suite /usr/local/bin/
ENTRYPOINT ["egf-structural-suite"]
