# syntax=docker/dockerfile:1
# Hugging Face Docker Space — Tauri v2 desktop app streamed via noVNC
# Build context: repository root (set path: hf-space in Space settings)

# ── Stage 1: Frontend ──
FROM node:20-bookworm AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY src/ src/
COPY index.html vite.config.ts tailwind.config.js postcss.config.js tsconfig.json tsconfig.node.json ./
RUN npx vite build

# ── Stage 2: Rust backend ──
FROM rust:1.81-bookworm AS backend
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
    librsvg2-dev patchelf libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev pkg-config && rm -rf /var/lib/apt/lists/*
COPY --from=frontend /app/dist ./dist
COPY src-tauri/ src-tauri/
WORKDIR /app/src-tauri
RUN cargo build --release

# ── Stage 3: Runtime with Xvfb + noVNC ──
FROM debian:bookworm-slim AS runtime
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-0 libgtk-3-0 libayatana-appindicator3-1 \
    librsvg2-2 libjavascriptcoregtk-4.1-0 libsoup3.0-1 \
    xvfb x11vnc novnc websockify \
    fonts-dejavu-core fonts-liberation \
    dbus-x11 procps && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash app
COPY --from=backend /app/src-tauri/target/release/egf-structural-suite /usr/local/bin/
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

USER app
WORKDIR /home/app

# HF Spaces expose 7860
EXPOSE 7860

ENTRYPOINT ["/usr/local/bin/start.sh"]
