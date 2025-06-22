# Rajarshi Mess Management System

A modern web application built with React, TypeScript, Firebase, and Mantine UI for managing mess operations with separate admin and user portals.

## 🚀 Features

- **Dual Authentication System**: Separate admin and user sign-in flows
- **Google OAuth**: Secure authentication using Google accounts
- **Role-based Access**: Different interfaces for admins and users
- **Local Development**: Firebase emulators for offline development
- **Modern UI**: Beautiful interface built with Mantine components
- **TypeScript**: Full type safety throughout the application

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: Mantine
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Routing**: React Router
- **Development**: Firebase Emulators
- **Styling**: CSS-in-JS with Mantine

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI
- Google account for Firebase project

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

The project is already configured with Firebase emulators. The firebase.json configuration includes:

- Authentication Emulator (port 9099)
- Firestore Emulator (port 8080)
- Storage Emulator (port 9199)
- Functions Emulator (port 5001)
- Hosting Emulator (port 5000)
- Emulator UI (port 4000)

### 3. Start Development Environment

**Option 1: Start emulators and dev server together**
```bash
npm run dev:emulators
```

**Option 2: Start them separately**

Terminal 1 (Firebase Emulators):
```bash
npm run emulators
```

Terminal 2 (React Dev Server):
```bash
npm run dev
```

### 4. Access the Application

- **Main App**: http://localhost:5173
- **Firebase Emulator UI**: http://localhost:4000
- **Admin Sign-in**: http://localhost:5173/admin-signin
- **User Sign-in**: http://localhost:5173/user-signin

## 🔐 Authentication

The application supports Google OAuth authentication with two separate portals:

### Admin Portal (`/admin-signin`)
- Designated for administrators
- Enhanced privileges and controls
- Admin badge and special UI elements

### User Portal (`/user-signin`)
- Standard user access
- Regular user interface and features

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── AppRouter.tsx   # Main routing component
│   └── Dashboard.tsx   # User dashboard
├── contexts/           # React context providers
│   └── AuthContext.tsx # Authentication state management
├── lib/               # Utility libraries
│   └── firebase.ts    # Firebase configuration
├── pages/             # Page components
│   ├── AdminSignIn.tsx
│   └── UserSignIn.tsx
└── App.tsx            # Main application component
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run emulators` - Start Firebase emulators
- `npm run dev:emulators` - Start both emulators and dev server
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🔥 Firebase Configuration

The project uses Firebase emulators for local development:

- **Authentication**: Google OAuth only
- **Firestore**: Document database for app data
- **Storage**: File storage capabilities
- **Functions**: Cloud functions (if needed)

## 🎨 UI Components

Built with Mantine UI library featuring:

- Modern, accessible components
- Consistent design system
- Dark/light theme support
- Responsive design
- Icon integration with Tabler Icons

## 🚀 Deployment

To deploy to Firebase:

```bash
npm run firebase:deploy
```

## 📝 Environment Variables

For production, update the Firebase configuration in `src/lib/firebase.ts` with your actual Firebase project credentials.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with emulators
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
