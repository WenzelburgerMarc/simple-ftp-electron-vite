
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:win": "npm run build && electron-builder --win --config --x64",
    "build:mac": "npm run build && ./node_modules/.bin/electron-builder --mac --config",
    "build:linux": "npm run build && electron-builder --linux --config"
