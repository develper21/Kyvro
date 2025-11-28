<div align="center">

# 🚀 Kyvro Desktop

[![Electron](https://img.shields.io/badge/Electron-2024E4E?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)

**📱 Advanced WhatsApp Business Desktop Application**

*Discord-style UI • 3D Animations • Enterprise-grade Security*

[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg?style=for-the-badge)](package.json)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=for-the-badge)](#)

---

</div>

## 📖 क्या है Kyvro?

**Kyvro** एक powerful desktop application है जो WhatsApp Business API को manage करने के लिए बनाया गया है। यह Discord-style UI के साथ आता है और enterprise-level features provide करता है।

### 🎯 मुख्य Features

- 🚀 **3D Animations** - Three.js और GSAP के साथ stunning visual effects
- 📱 **Campaign Management** - Advanced WhatsApp campaigns with real-time tracking
- 🔒 **Enterprise Security** - AES-256 encryption और secure credential storage
- 📊 **Analytics Dashboard** - Real-time statistics और performance metrics
- 🎨 **Discord-style UI** - Modern, glassmorphic design with smooth animations
- ⚡ **High Performance** - Web Workers और smart queuing system
- 🔄 **Auto Scheduling** - Campaign scheduling और automated workflows

---

## 🛠️ Technology Stack

### Frontend Technologies
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **TailwindCSS** | Styling | 3.x |
| **Framer Motion** | Animations | 10.x |
| **Three.js** | 3D Graphics | r128 |
| **GSAP** | Advanced Animations | 3.x |
| **Zustand** | State Management | 4.x |

### Backend Technologies
| Technology | Purpose | Version |
|------------|---------|---------|
| **Electron** | Desktop Framework | 28.x |
| **SQLite** | Local Database | better-sqlite3 |
| **Node.js** | Runtime | 20.x |
| **Keytar** | Secure Storage | latest |

### Development Tools
| Technology | Purpose | Version |
|------------|---------|---------|
| **Vite** | Build Tool | 5.x |
| **ESLint** | Code Quality | 8.x |
| **Prettier** | Code Formatting | 3.x |

---

## 🚀 Installation

### Prerequisites
- **Node.js** 20.x या उससे नया version
- **npm** या **yarn** package manager
- **Git** for version control

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/kyvro-desktop.git
cd kyvro-desktop

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development Commands
```bash
# Development
npm run dev          # Start development server
npm run electron:dev # Start Electron in dev mode

# Building
npm run build        # Build React app
npm run electron:build # Build Electron app
npm run dist         # Create distributable

# Testing
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 📱 Features Overview

### 🎨 Discord-style Interface
- **Glassmorphic Design** - Modern blur effects और transparency
- **Smooth Animations** - 60fps transitions और micro-interactions
- **Dark Theme** - Eye-friendly dark mode
- **Responsive Layout** - Multiple screen sizes पर perfect display

### 📊 Campaign Management
- **Multi-step Campaign Creation** - Guided wizard interface
- **CSV Import** - Drag & drop contact import
- **Template Selection** - WhatsApp template management
- **Real-time Progress** - Live campaign tracking
- **Smart Scheduling** - Advanced scheduling options

### 🔒 Security Features
- **AES-256 Encryption** - Military-grade encryption
- **Secure Storage** - System keychain integration
- **API Key Protection** - Encrypted credential storage
- **Data Privacy** - Local-first approach

### ⚡ Performance
- **Web Workers** - Background processing
- **Smart Queuing** - Rate limiting और retry logic
- **Caching** - Optimized data handling
- **Memory Management** - Efficient resource usage

---

## 🏗️ Project Structure

```
kyvro-desktop/
├── 📁 electron/                 # Electron main process
│   ├── main.ts                  # Main window setup
│   ├── preload.ts               # Secure IPC bridge
│   └── services/                # Backend services
│       ├── databaseService.ts   # SQLite management
│       ├── fileService.ts       # File operations
│       ├── notificationService.ts # System notifications
│       ├── schedulerService.ts  # Task scheduling
│       ├── secureStore.ts       # Encrypted storage
│       └── whatsappApi.ts      # WhatsApp API client
├── 📁 src/                      # React frontend
│   ├── components/              # UI components
│   │   ├── layout/              # Layout components
│   │   ├── ui/                  # Reusable UI components
│   │   └── AnimatedLogo.tsx    # 3D animated logo
│   ├── features/                # Feature modules
│   │   ├── dashboard/           # Dashboard UI
│   │   └── campaigns/           # Campaign management
│   ├── assets/                  # Static assets
│   │   └── animations/          # 3D animations
│   ├── lib/                     # Utility libraries
│   └── workers/                 # Web workers
├── 📁 public/                   # Public assets
├── 📄 package.json             # Dependencies
├── 📄 tsconfig.json            # TypeScript config
├── 📄 tailwind.config.js       # Tailwind config
├── 📄 vite.config.ts           # Vite build config
└── 📄 .gitignore               # Git ignore rules
```

---

## 🎯 Core Concepts

### 🏠 Architecture
Kyvro **Electron + React** architecture use करता है:
- **Main Process** (Electron) - System operations और security
- **Renderer Process** (React) - UI और user interactions
- **IPC Bridge** - Secure communication between processes

### 🔐 Security Model
- **Context Isolation** - Renderer process isolation
- **CSP Headers** - Content Security Policy
- **Preload Scripts** - Secure API exposure
- **Encrypted Storage** - Local data encryption

### 📊 Data Flow
1. **User Interaction** → React UI
2. **IPC Request** → Main Process
3. **Service Processing** → Business Logic
4. **Database/API** → Data Operations
5. **Response** → UI Update

---

## 🛠️ Development Guide

### 🎨 UI Components
```typescript
// Example usage of UI components
import { Button, Card, Modal } from '@/components/ui';

<Button variant="primary" size="md">
  Send Campaign
</Button>

<Card variant="glass" hover>
  Campaign Stats
</Card>
```

### 🔌 Service Usage
```typescript
// Example service integration
import { DatabaseService, WhatsAppApiService } from '@/services';

const dbService = new DatabaseService();
await dbService.initialize();

const whatsappService = new WhatsAppApiService();
await whatsappService.sendMessage(phone, message);
```

### 🎬 3D Animations
```typescript
// Example 3D animation usage
import AnimatedLogo from '@/components/AnimatedLogo';

<AnimatedLogo 
  type="logo" 
  className="w-32 h-32"
  onMouseEnter={handleHover}
/>
```

---

## 📋 API Documentation

### WhatsApp Business API Integration
```typescript
// Send message
await whatsappApi.sendMessage({
  to: '+1234567890',
  templateName: 'welcome',
  language: 'en',
  components: [...]
});

// Get templates
const templates = await whatsappApi.getTemplates();
```

### Database Operations
```typescript
// Create campaign
const campaignId = await dbService.createCampaign({
  name: 'Welcome Series',
  templateName: 'welcome',
  totalContacts: 1000
});

// Get statistics
const stats = await dbService.getDashboardStats();
```

---

## 🔧 Configuration

### Environment Variables
```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/...
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Database
DB_PATH=./userData/kyvro.db

# Application
NODE_ENV=development
LOG_LEVEL=info
```

### Application Settings
```typescript
// config/app.json
{
  "app": {
    "name": "Kyvro Desktop",
    "version": "1.0.0",
    "window": {
      "width": 1200,
      "height": 800,
      "minWidth": 800,
      "minHeight": 600
    }
  },
  "api": {
    "timeout": 30000,
    "retryAttempts": 3
  }
}
```

---

## 🚀 Deployment

### Build for Production
```bash
# Build React app
npm run build

# Build Electron app
npm run electron:build

# Create distributables
npm run dist
```

### Platform-specific Builds
```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

---

## 🤝 Contributing

Contributions welcome हैं! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style
- **TypeScript** strict mode
- **ESLint** rules follow करें
- **Prettier** formatting use करें
- **Conventional Commits** message format follow करें

---

## 📄 License

यह project **MIT License** के तहत licensed है। Details के लिए [LICENSE](LICENSE) file देखें।

---

## 🆘 Support

### Help & Documentation
- 📖 [Documentation](docs/README.md)
- 🐛 [Issue Tracker](https://github.com/your-username/kyvro-desktop/issues)
- 💬 [Discussions](https://github.com/your-username/kyvro-desktop/discussions)

### Contact
- 📧 Email: support@kyvro.com
- 🐦 Twitter: [@kyvro_app](https://twitter.com/kyvro_app)
- 💬 Discord: [Join our community](https://discord.gg/kyvro)

---

## 🎉 Acknowledgments

- **Electron Team** - Amazing desktop framework
- **React Community** - Excellent UI library
- **Three.js** - Powerful 3D graphics
- **WhatsApp Business** - API platform
- **Discord Design Team** - UI inspiration

---

<div align="center">

**Made with ❤️ by the Kyvro Team**

[![Back to top](https://img.shields.io/badge/Back%20to%20top-000000?style=for-the-badge)](#kyvro-desktop)

</div>
