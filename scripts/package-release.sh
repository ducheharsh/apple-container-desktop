#!/bin/bash

# Container GUI Release Packaging Script
# Creates a clean release package for distribution

set -e

echo "🚀 Container GUI Release Packaging"
echo "=================================="

# Configuration
APP_NAME="Container GUI"
VERSION="1.1.1"
BUILD_DIR="src-tauri/target/release/bundle"
RELEASE_DIR="release"
DATE=$(date +%Y%m%d)

# Clean previous release
echo "📦 Cleaning previous release..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

# Copy app bundle
echo "📱 Copying app bundle..."
cp -R "$BUILD_DIR/macos/$APP_NAME.app" "$RELEASE_DIR/"

# Copy DMG (rename to standard format)
echo "💿 Copying DMG installer..."
DMG_FILE=$(find "$BUILD_DIR/dmg" -name "*.dmg" | head -1)
if [ -f "$DMG_FILE" ]; then
    cp "$DMG_FILE" "$RELEASE_DIR/Container-GUI-$VERSION-aarch64.dmg"
    echo "   ✅ DMG: Container-GUI-$VERSION-aarch64.dmg"
else
    echo "   ⚠️  DMG not found"
fi

# Copy documentation
echo "📚 Copying documentation..."
cp README.md "$RELEASE_DIR/"
cp RELEASE.md "$RELEASE_DIR/"
cp TROUBLESHOOTING.md "$RELEASE_DIR/"

# Create checksums
echo "🔐 Generating checksums..."
cd "$RELEASE_DIR"
shasum -a 256 *.dmg > checksums.sha256 2>/dev/null || echo "No DMG files to checksum"
if [ -d "Container GUI.app" ]; then
    # Create checksum for the app bundle
    zip -r "Container GUI.app.zip" "Container GUI.app" > /dev/null
    shasum -a 256 "Container GUI.app.zip" >> checksums.sha256
fi
echo "   ✅ Checksums generated"

# Create release info
echo "📄 Creating release info..."
cat > release-info.txt << EOF
Container GUI v$VERSION - Major Marketplace Update
Release Date: $(date)
Platform: macOS (Apple Silicon)
Architecture: aarch64

# get the latest release info from the release.md file
RELEASE_INFO=$(cat RELEASE.md)

🎉 NEW FEATURES IN v$VERSION:
$RELEASE_INFO

Files included:
- Container GUI.app (Application Bundle)
- Container-GUI-$VERSION-aarch64.dmg (Installer)
- Container GUI.app.zip (Portable Bundle)
- README.md (Documentation)
- RELEASE.md (Detailed Release Notes)
- TROUBLESHOOTING.md (Problem Resolution)
- checksums.sha256 (File Verification)

Installation:
1. Install Apple Container CLI from https://github.com/apple/container/releases
2. Double-click the DMG file or drag the .app to Applications
3. Launch from Applications folder
4. Navigate to the new "Marketplace" tab to explore images

System Requirements:
- Apple Silicon Mac (M1, M2, M3, M4)
- macOS 15.0 or later
- Apple Container CLI v0.1.0+ installed
- Internet connection for Docker Hub integration

Support:
- Check system requirements in the app
- Verify container CLI with: container --version
EOF

cd ..

# Display results
echo ""
echo "✅ Release package created successfully!"
echo "📂 Location: $RELEASE_DIR/"
echo ""
echo "📦 Package contents:"
ls -la "$RELEASE_DIR/"
echo ""
echo "📊 File sizes:"
du -sh "$RELEASE_DIR"/*
echo ""
echo "🚀 Ready for distribution!"
echo ""
echo "🎉 Container GUI v$VERSION Features:"
echo "$RELEASE_INFO"
echo ""
echo "Next steps:"
echo "1. Test the app: open '$RELEASE_DIR/$APP_NAME.app'"
echo "2. Test the DMG: open '$RELEASE_DIR/Container-GUI-$VERSION-aarch64.dmg'"
echo "3. Test marketplace: Search for images and try pulling"
echo "4. Upload to GitHub releases"
echo "5. Share the Container Image Marketplace with users!" 