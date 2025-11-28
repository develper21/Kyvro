# 🚀 Kyvro Desktop - Build & Release Guide

## 📋 Build Process

### 1. Development Setup
```bash
cd kyvro-desktop
npm install
```

### 2. Build for All Platforms
```bash
# Build React app
npm run build

# Build Electron app
npm run build:electron

# Build platform-specific binaries
npm run dist:linux    # Linux (AppImage, deb, rpm, snap)
npm run dist:win      # Windows (.exe installer, portable)
npm run dist:mac      # macOS (.dmg, .zip)

# Or build all at once
npm run dist:all
```

## 📦 Release Files Location

After building, you'll find release files in:
```
kyvro-desktop/release/
├── linux/
│   ├── Kyvro Desktop-1.0.0.AppImage
│   ├── kyvro-desktop_1.0.0_amd64.deb
│   ├── kyvro-desktop-1.0.0.x86_64.rpm
│   └── kyvro-desktop-1.0.0.snap
├── win/
│   ├── Kyvro Desktop Setup 1.0.0.exe
│   └── Kyvro Desktop 1.0.0.exe
└── mac/
    ├── Kyvro Desktop-1.0.0.dmg
    └── Kyvro Desktop-1.0.0.zip
```

## 🎯 GitHub Release Process

### Step 1: Create a Tag
```bash
# Create and push a new tag
git tag v1.0.0
git push origin v1.0.0
```

### Step 2: Create Release on GitHub
1. Go to: https://github.com/develper21/Kyvro/releases
2. Click "Create a new release"
3. Choose the tag you just created (v1.0.0)
4. Add release title and description
5. Upload the build files from `release/` folder

### Step 3: Upload Files
For each platform, upload these files:

#### 🐧 Linux Files:
- `Kyvro Desktop-1.0.0.AppImage` - Portable Linux app
- `kyvro-desktop_1.0.0_amd64.deb` - Debian/Ubuntu installer
- `kyvro-desktop-1.0.0.x86_64.rpm` - RedHat/Fedora installer
- `kyvro-desktop-1.0.0.snap` - Snap store package

#### 🪟 Windows Files:
- `Kyvro Desktop Setup 1.0.0.exe` - Windows installer
- `Kyvro Desktop 1.0.0.exe` - Portable Windows app

#### 🍎 macOS Files:
- `Kyvro Desktop-1.0.0.dmg` - macOS installer
- `Kyvro Desktop-1.0.0.zip` - macOS archive

## 🔧 Platform-Specific Instructions

### Linux Installation
```bash
# AppImage (Portable)
chmod +x "Kyvro Desktop-1.0.0.AppImage"
./"Kyvro Desktop-1.0.0.AppImage"

# DEB (Debian/Ubuntu)
sudo dpkg -i kyvro-desktop_1.0.0_amd64.deb

# RPM (RedHat/Fedora)
sudo rpm -i kyvro-desktop-1.0.0.x86_64.rpm

# Snap
sudo snap install kyvro-desktop-1.0.0.snap
```

### Windows Installation
- Run `Kyvro Desktop Setup 1.0.0.exe` for installation
- Or use `Kyvro Desktop 1.0.0.exe` for portable version

### macOS Installation
- Open `Kyvro Desktop-1.0.0.dmg` and drag to Applications
- Or extract `Kyvro Desktop-1.0.0.zip`

## 📝 Release Notes Template

```
## 🎉 Kyvro Desktop v1.0.0

### ✨ New Features
- WhatsApp Business Campaign Management
- Discord-style Glassmorphic UI
- Cross-platform support (Linux, Windows, macOS)
- Local SQLite database storage
- CSV import/export functionality
- Real-time campaign tracking

### 🐧 Linux Downloads
- [AppImage](download-link) - Portable version
- [DEB Package](download-link) - Debian/Ubuntu
- [RPM Package](download-link) - RedHat/Fedora  
- [Snap Package](download-link) - Universal Linux

### 🪟 Windows Downloads
- [Installer (.exe)](download-link) - Setup wizard
- [Portable (.exe)](download-link) - No installation

### 🍎 macOS Downloads
- [DMG Installer](download-link) - Drag & drop
- [ZIP Archive](download-link) - Portable version

### 🔐 Security
- AES-256 encryption for local data
- Secure API key storage
- Context isolation for security

### 📱 Requirements
- Node.js 18+ (for development)
- 4GB RAM minimum
- 500MB disk space
```

## 🚀 Quick Release Commands

```bash
# Complete release process
npm run build:electron
npm run dist:all
git tag v1.0.0
git push origin v1.0.0
# Then go to GitHub and create release with files from release/ folder
```

## 🌐 Web Version

Web version is automatically deployed to:
https://develper21.github.io/Kyvro/kyvro-desktop/

This has limited functionality (no desktop features like file access, notifications, etc.).
