#!/bin/bash

# Check for node
if ! command -v node &> /dev/null; then
    echo "Error: 'node' command not found. Please install Node.js (https://nodejs.org)."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: 'npm' command not found. Please install npm (included with Node.js)."
    exit 1
fi

echo "Installing dependencies..."
npm install

echo "Starting development server..."
npm run dev
    