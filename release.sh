#!/bin/bash

# Kyvro Desktop - Quick Release Script
# This script helps you build and prepare releases for all platforms

echo "🚀 Kyvro Desktop - Release Builder"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the kyvro-desktop directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf release/
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build React app
echo "🔨 Building React app..."
npm run build

# Build Electron app
echo "⚡ Building Electron app..."
npm run build:electron

# Build for all platforms
echo "💻 Building for all platforms..."
npm run dist:all

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📁 Release files are ready in: ./release/"
echo ""
echo "📋 Next steps:"
echo "1. Create a tag: git tag v1.0.0"
echo "2. Push tag: git push origin v1.0.0"
echo "3. Go to: https://github.com/develper21/Kyvro/releases"
echo "4. Create new release with tag v1.0.0"
echo "5. Upload files from release/ folder"
echo ""

# Show what files were created
if [ -d "release" ]; then
    echo "📦 Generated files:"
    find release -type f -name "*.exe" -o -name "*.deb" -o -name "*.rpm" -o -name "*.snap" -o -name "*.AppImage" -o -name "*.dmg" -o -name "*.zip" | sort
    echo ""
fi

echo "🎉 Ready for GitHub release!"
