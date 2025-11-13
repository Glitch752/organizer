#!/usr/bin/env -S just --justfile

server:
    cd server && pnpm dev

client:
    cd client && pnpm dev