# BARON TRUMP FACTS™

A satirical mobile-first Progressive Web App (PWA) — a conspiracy theory intel delivery system that treats Barron Trump as a supernatural spy thriller protagonist.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Loading on Mobile

### iOS (Safari)
1. Open the app URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home screen" or "Install app"
4. Confirm the installation

## Features

### Core Features
- **Splash Screen**: Terminal-style boot sequence animation
- **Dashboard**: Threat level indicator, daily fact, navigation
- **Archive**: Full repository of 30+ classified facts with search/filter
- **Transmit**: Send intel via email (requires EmailJS setup)
- **Sightings**: Live tracker with rotating fake reports
- **Settings**: Clearance level, visual toggles, data management

### Easter Eggs (10 Total)

1. **Konami Code**: ↑↑↓↓←→←→BA → Unlocks Level 4 clearance with 5 top secret facts
2. **Squirrel Rain**: Tap 🐿️ button 7 times rapidly → Screen fills with squirrels
3. **Mirror Room**: Tap "mirror" 3x in any fact containing it → Screen inverts
4. **3:33 AM Check**: Open app between 3:30-3:36 AM → Special red-screen message
5. **Shake to Declassify**: Shake phone → Temporarily reveals redacted text
6. **The 66th Tap**: 66th total tap anywhere → Flash message from "the 66th floor"
7. **Long Press Logo**: Hold "BARON TRUMP FACTS™" for 2+ seconds → Fake transmission
8. **Pull to Refresh 3x**: Quick triple pull-to-refresh in Archive → All facts redacted
9. **Protocol 17**: Visit on the 17th of any month → Gold border, special badge
10. **Theory Board**: Two-finger swipe left on dashboard → Hidden conspiracy board

## EmailJS Setup

The Transmit feature requires EmailJS for sending emails. Follow these steps:

### 1. Create EmailJS Account
- Go to [emailjs.com](https://www.emailjs.com/)
- Sign up for a free account (200 emails/month)

### 2. Create Email Service
- Go to Email Services
- Click "Add New Service"
- Select your email provider (Gmail recommended)
- Follow OAuth setup instructions
- Note your **Service ID**

### 3. Create Email Template
- Go to Email Templates
- Click "Create New Template"
- Set up template with these variables:
  - `{{to_email}}` - Recipient email
  - `{{subject}}` - Email subject line
  - `{{message}}` - Email body content
- Note your **Template ID**

### 4. Get Public Key
- Go to Account → API Keys
- Copy your **Public Key**

### 5. Update Configuration
Open `src/utils/emailService.js` and replace:

```javascript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';  // Your Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Your Template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';   // Your Public Key
```

## Project Structure

```
baron-trump-facts/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   ├── icon.svg            # App icon
│   ├── icon-192.svg        # 192x192 icon
│   └── icon-512.svg        # 512x512 icon
└── src/
    ├── main.jsx            # Entry point
    ├── App.jsx             # Main app component
    ├── index.css           # Global styles + Tailwind
    ├── components/
    │   ├── SplashScreen.jsx
    │   ├── Dashboard.jsx
    │   ├── Archive.jsx
    │   ├── FactCard.jsx
    │   ├── Transmit.jsx
    │   ├── Sightings.jsx
    │   ├── SightingCard.jsx
    │   ├── Settings.jsx
    │   └── TheoryBoard.jsx
    ├── data/
    │   ├── facts.js        # All facts data
    │   ├── sightings.js    # Sighting reports
    │   └── emails.js       # Email templates
    ├── hooks/
    │   ├── useKonamiCode.js
    │   ├── useShakeDetection.js
    │   └── useEasterEggs.js
    └── utils/
        ├── storage.js      # LocalStorage helpers
        └── emailService.js # EmailJS integration
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **EmailJS** - Client-side email sending
- **PWA** - Progressive Web App support

## Design

- **Theme**: Dark ops intelligence terminal
- **Colors**: Deep black (#0a0a0a), electric cyan (#00f5ff), warning red (#ff3333), classified gold (#ffd700)
- **Effects**: Scanlines, CRT flicker, glitch animations
- **Fonts**: JetBrains Mono (terminal), Orbitron (headers)

## Disclaimer

This is a satirical parody app for entertainment purposes only. All "facts" are entirely fictional. This app is not affiliated with, endorsed by, or connected to any real individuals mentioned.

## Version

v1.9.47-classified

---

*"Miss a day = miss the truth."*
