#!/bin/bash
set -e

cd apps/server/src/main/webui
pnpm install
npx playwright install chrome
