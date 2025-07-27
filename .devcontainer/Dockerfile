# Start from base image
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node

# Install wbritish
RUN apt-get update \
    && apt-get install -y wamerican \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
