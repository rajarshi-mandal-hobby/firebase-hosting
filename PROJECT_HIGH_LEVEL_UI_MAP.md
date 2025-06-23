# PROJECT HIGH-LEVEL UI MAP
*Generated: June 22, 2025*

## APPLICATION ARCHITECTURE

```
App.tsx
└── AppRouter.tsx (React Router)
    ├── Authentication Flow
    │   ├── SignIn.tsx (Google Auth)
    │   ├── PhoneVerification.tsx (OTP)
    │   └── Protected Routes
    │
    └── Main Application
        ├── Dashboard.tsx (Student View - Not shown)
        └── AdminDashboard.tsx (Admin View - MAIN FOCUS)
            ├── AdminHeader.tsx
            ├── AdminNavigation.tsx (Segmented Control)
            └── Content Sections (Conditional Rendering)
                ├── BillsSection.tsx (activeSection === 'bills')
                ├── MembersSection.tsx (activeSection === 'members')
                └── ConfigManagement.tsx (activeSection === 'config')
```

## DETAILED COMPONENT BREAKDOWN

### 1. AppRouter.tsx - Main Router
```
Routes:
├── / → Redirect to dashboard
├── /dashboard → AdminDashboard (if admin) | Dashboard (if student)
├── /signin → SignIn
├── /verify → PhoneVerification
└── * → Redirect to dashboard
```

### 2. AdminDashboard.tsx - Main Admin Interface
```
Container
├── AdminHeader.tsx
├── AdminNavigation.tsx
└── Conditional Content Sections:
    ├── BillsSection (when activeSection === 'bills')
    ├── MembersSection (when activeSection === 'members')
    └── ConfigManagement (when activeSection === 'config')
```

### 3. AdminNavigation.tsx - Section Switcher
```
Paper
└── SegmentedControl
    ├── Bills (default)
    ├── Members
    └── Config
```

### 4. BillsSection.tsx - Billing Management
```
Stack
├── Billing Overview Cards
├── Filter Controls (by floor)
├── Active Students List
│   └── Student Cards with:
│       ├── Basic Info
│       ├── Outstanding Balance
│       ├── Collapsible Details
│       └── Action Buttons
└── Empty States / Loading States
```

### 5. MembersSection.tsx - Student Management (CURRENT FOCUS)
```
Stack
├── Statistics Panel
├── Action Controls (Search + Add + Filter)
└── Students List (Accordion)
    ├── StudentModal (Add/Edit)
    └── DeleteStudentModal (Delete)
```

### 6. ConfigManagement.tsx - System Configuration
```
Stack
├── Base Configuration Forms
├── Admin Management
└── System Settings
```

## CURRENT STATE ANALYSIS

### ✅ IMPLEMENTED & WORKING
1. **Authentication Flow**: Google Auth + Phone verification
2. **Admin Dashboard**: Main layout with navigation
3. **Members Section**: Full CRUD for students
4. **Config Management**: System configuration
5. **Real-time Data**: Firestore integration
6. **Responsive Design**: Mantine UI components

### ⚠️ PARTIALLY IMPLEMENTED
1. **Bills Section**: Basic structure, needs billing logic
2. **Student Dashboard**: Exists but not fully functional
3. **Data Validation**: Client-side only, needs server-side
4. **Error Handling**: Basic, needs improvement

### ❌ NOT IMPLEMENTED / NEEDS WORK
1. **Cloud Functions**: Backend business logic
2. **Payment Recording**: UI exists, backend missing
3. **Expense Management**: UI exists, backend missing
4. **Rent History**: Database structure exists, UI missing
5. **Settlement Calculations**: Partially implemented

## FUNCTIONAL PRIORITIES

### Phase 1: Core Functionality (Make it Work)
1. **Fix Field Name Alignment** (Firestore.txt vs current code)
2. **Complete CRUD Operations** for students
3. **Implement Cloud Functions** for:
   - Student addition with initial rent history
   - Student deactivation with settlement
   - Basic validation and business logic

### Phase 2: Billing System (Essential Features)
1. **Rent History Management**
2. **Payment Recording System**
3. **Monthly Bill Generation**
4. **Outstanding Balance Tracking**

### Phase 3: Enhanced Features
1. **Advanced Search & Filtering**
2. **Bulk Operations**
3. **Export/Import Functions**
4. **Notification System**

## TECHNICAL ARCHITECTURE

### Frontend Stack
```
React + TypeScript + Vite
├── UI Framework: Mantine
├── Routing: React Router
├── State Management: React Context + useState
├── Data Fetching: Custom hooks + Firestore SDK
└── Form Handling: Mantine forms + custom validation
```

### Backend Stack
```
Firebase
├── Authentication: Firebase Auth
├── Database: Firestore
├── Functions: Cloud Functions (TypeScript)
├── Hosting: Firebase Hosting
└── Storage: Firebase Storage (future)
```

### Data Flow
```
UI Components
├── Custom Hooks (useFirestore, useAuth, useConfig)
├── Firestore SDK (real-time listeners)
├── Cloud Functions (business logic)
└── Firestore Database (data persistence)
```

## FOLDER STRUCTURE (Feature-Based)
```
src/
├── components/
│   ├── admin/
│   │   ├── core/ (AdminDashboard, Header, Navigation)
│   │   ├── bills/ (BillsSection + related components)
│   │   ├── members/ (MembersSection + modals)
│   │   └── settings/ (ConfigManagement + forms)
│   ├── common/ (shared UI components)
│   └── auth/ (authentication components)
├── hooks/ (custom React hooks)
├── lib/ (Firebase configuration, utilities)
├── types/ (TypeScript interfaces)
├── pages/ (route components)
└── utils/ (helper functions)
```

## IMMEDIATE ACTION PLAN

### 1. Fix Critical Issues (Field Alignment)
- Update Student type to match Firestore.txt
- Fix all field name references
- Test CRUD operations

### 2. Complete Core Functionality
- Implement missing cloud functions
- Add proper error handling
- Complete settlement calculations

### 3. Test & Validate
- Test all CRUD operations
- Validate real-time updates
- Check field name consistency

### 4. Polish UI (Later Phase)
- Improve visual design
- Add loading states
- Enhance user experience

---
*This high-level map shows the entire project structure and priorities for making the application functional.*
