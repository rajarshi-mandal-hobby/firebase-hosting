# Rent Management Application: UI/UX Design Specification

## 1. Introduction

This document outlines the UI/UX design for the rent management application, focusing on simplicity and clarity using Mantine UI components. The design prioritizes ease of use while maintaining functionality across different user roles.

---

## 2. Design System Foundation

### 2.1. Main Container Structure
- **Large screens**: Container size `md` with `vh: 100`
- **Small screens**: Container size `sm` with `vh: 100`
- **Purpose**: This container holds all pages and components consistently

### 2.2. Theme Configuration
- **Primary Theme**: Black text on white background (light theme) - High contrast design
- **Secondary Theme**: Dark theme option available for user preference
- **Color Philosophy**: High-contrast black buttons, contrasting grey tones, sharp visual hierarchy
- **Design References**: 
  - [UI Design Tips #14](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips-14) - High contrast and visual clarity
  - [UI Design Tips Collection](https://www.adhamdannaway.com/blog/ui-design/ui-design-tips) - Professional design principles
  - [Practical UI Design System](https://www.practical-ui.com/design-system/) - Modern design system examples
- **Default Props Strategy**: Use Mantine's defaultProps to set consistent styling globally
- **Spacing**: Mantine's default spacing system with generous white space
- **No Bottom Bar**: Clean, minimal navigation approach
- **Visual Hierarchy**: Strong contrast between primary and secondary elements

### 2.3. Enhanced Default Props Configuration
- **Primary Color**: Dark (black) for high contrast
- **Button Design**: Black filled buttons as primary actions, outlined for secondary
- **Border Radius**: Set `lg` as default for Paper, Modal, and interactive components
- **Shadows**: Set `lg` as default for Paper and elevated components, `xl` for modals
- **Paper Components**: Include borders (`withBorder: true`) for clear definition
- **Color Scheme**: Configure light/dark theme switching capability
- **Component Defaults**: Apply consistent styling through theme defaultProps
- **High Contrast Principle**: Strong visual separation between interactive and static elements

### 2.4. Development Guidelines
- **No Inline CSS**: Use Mantine's styling system and theme configuration
- **Default Props**: Leverage defaultProps for consistent component styling
- **Mantine Documentation**: Follow official patterns and best practices
- **Component Consistency**: Shared components for uniform user experience
- **Theme References**: 
  - [Mantine Provider](https://mantine.dev/theming/mantine-provider/)
  - [Default Props](https://mantine.dev/theming/default-props/)
  - [Mantine Colors](https://mantine.dev/theming/colors/)
  - [Color Schemes](https://mantine.dev/theming/color-schemes/)

- **Primary Font**: Nunito Sans from Google Fonts
- **Font Weights**: Regular (400), Medium (500), Semi-bold (600), Bold (700)
- **Font Loading**: Optimized loading with font-display: swap
- **Icon System**: SVG icons from Google Fonts (Material Symbols)
- **Icon Usage**: Prefer SVG icons over text for space-constrained areas (signout, filter, menu, etc.)

### 2.6. Enhanced Default Props Configuration
- **Border Radius**: 
  - Buttons: `xl` (maximum rounded for modern, friendly appearance)
  - Inputs: `md` (medium radius for form elements)
  - Papers/Cards: `lg` (consistent with modern design)
- **Button Styling**:
  - Primary actions: Black filled buttons (`color: 'dark', variant: 'filled'`)
  - Secondary actions: Outlined or subtle variants
  - Clear visual hierarchy between action types
- **Paper Components**: 
  - Include borders for clear definition (`withBorder: true`)
  - Enhanced shadows for depth perception
- **Input Enhancements**:
  - Use `leftSection` for icons in inputs and number inputs
  - Proper HTML5 validation attributes
  - Clear labels and descriptions for accessibility
- **High Contrast Elements**: Strong visual separation for better usability
- **Error Handling**: Server errors displayed through Mantine notifications
- **Loading States**: Loading overlays for forms, skeletons for content loading

### 2.7. Shared Notification System
- **Position**: Bottom center notifications for optimal user attention without obstruction
- **Error Notifications**: Red color scheme with retry actions where applicable
- **Success Notifications**: Green color scheme with confirmation messages
- **Loading Notifications**: Blue color scheme for ongoing processes
- **Shared Implementation**: Centralized notification service across all components
- **Auto-dismiss**: 4 seconds for success, 6 seconds for errors, persistent for critical errors
- **Stacking**: Multiple notifications queue properly without overlap
- **Reference**: [Mantine Notifications](https://mantine.dev/x/notifications/)

#### 2.7.1. UX Design Principles Applied
- **Non-intrusive Positioning**: Bottom center avoids blocking user workflows
- **Clear Visual Hierarchy**: Color coding provides immediate context understanding
- **Progressive Disclosure**: Detailed error information available on hover/click
- **Consistent Messaging**: Standardized notification patterns across application
- **Accessible Design**: High contrast colors and proper ARIA announcements

### 2.8. Enhanced UX Design Principles (Applied Throughout)

Based on UI design best practices and practical UI guidelines:

#### 2.8.1. Visual Hierarchy and Clarity
- **High Contrast Design**: Black buttons on white background for maximum clarity
- **Information Architecture**: Primary actions prominently placed with strong visual weight
- **Color Psychology**: 
  - Black for primary actions and important elements
  - Red for destructive actions and due payments
  - Green for positive outcomes and paid status
  - Grey tones for secondary information and subtle separators
- **Typography Scale**: Clear distinction between headings, body text, and labels using font weights
- **White Space Usage**: Generous spacing prevents cognitive overload and improves readability
- **Sharp Borders**: Clear component boundaries using borders and shadows
- **Visual Weight**: Strong contrast between interactive and static elements

#### 2.8.2. Cognitive Load Reduction
- **Progressive Disclosure**: Advanced features hidden behind sub-tabs (Admin in Config)
- **Familiar Patterns**: Standard form layouts and interaction patterns users expect
- **Consistent Navigation**: Predictable placement of controls and actions
- **Smart Defaults**: Pre-filled forms with sensible defaults reduce user effort

#### 2.8.3. Error Prevention and Recovery
- **Input Validation**: Real-time feedback prevents errors before submission
- **Confirmation Dialogs**: Destructive actions require explicit confirmation
- **Retry Mechanisms**: Failed operations provide clear recovery paths
- **Loading States**: Users understand system is processing their requests

#### 2.8.4. Accessibility and Inclusion
- **Keyboard Navigation**: All functionality accessible without mouse
- **Screen Reader Support**: Proper semantic markup and ARIA labels
- **Color Contrast**: High contrast ratios for text and interactive elements
- **Touch Targets**: Minimum 44px targets for mobile interaction

#### 2.8.5. Performance and Responsiveness
- **Perceived Performance**: Skeleton loaders and loading states keep users engaged
- **Progressive Loading**: Critical content loads first, enhancements follow
- **Responsive Design**: Fluid layouts that work across all device sizes
- **Efficient Interactions**: Minimal steps to complete common tasks

---

## 3. Shared Components and Layouts

### 3.1. Shared Avatar Component
- **Profile Image**: Display Google profile image when available
- **Fallback**: Show first and last name initials (capitalized) when no image
- **Consistent Sizing**: Uniform size across all app sections
- **Styling**: Inherits theme's default radius through defaultProps

### 3.2. Shared Modal Component
- **Header Section**: 
  - Prominent text following UI design guidelines
  - Close icon (SVG) positioned consistently
- **Footer Section**: 
  - Action buttons with consistent styling
  - Primary/secondary button hierarchy
  - Loading states during form submission
- **Background**: Blurred backdrop for focus
- **Structure**: Consistent modal layout across all use cases
- **Styling**: Uses theme's default radius and shadow through defaultProps
- **Loading Overlay**: Applied during form submission to prevent double-submission

### 3.3. Layout Components
- **Main Container**: 
  - Responsive container (md/sm) with full viewport height
  - Consistent padding and spacing
  - Nunito Sans font family applied
- **Section Papers**: 
  - Paper components inherit default radius and shadow from theme
  - Uniform spacing through theme defaults
- **Navigation Elements**: 
  - Clean, minimal navigation without bottom bars
  - SVG icons for space-constrained areas
  - Consistent styling through theme defaultProps

### 3.4. Loading and Error States
- **Skeleton Components**: Used for content that's loading from Firestore
- **Loading Overlays**: Applied to forms during submission
- **Error Boundaries**: React error boundaries for graceful error handling
- **Retry Mechanisms**: Automatic retry for failed operations with user feedback
- **Network Status**: Connection state indicators for offline scenarios

---

## 4. Member Dashboard UI

### 4.1. Layout Structure
```
┌─────────────────────────────────────┐
│ [← Back] (Admin only)               │ ← Conditional header
├─────────────────────────────────────┤
│ 👤 [Avatar] Member Name         [⌄] │ ← Header with signout ActionIcon
│         member@email.com            │ ← Email below name (muted)
├─────────────────────────────────────┤
│ [Me] [Other Members]                │ ← Main navigation Segmented control
├─────────────────────────────────────┤
│ ⬇️ My Details                    ⬇️ │ ← Collapsible Accordion
│ ┌─────────────────────────────────┐ │
│ │ • +91XXXXXXXXXX (muted)        │ │ ← Member details in List format
│ │ • Floor: 2nd - Bed             │ │
│ │ • Move-in: Jan 15, 2024        │ │
│ │ • Current Rent: ₹1,600/month   │ │
│ │ • WiFi: Opted In               │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ July 2025           [✓] [Pay ₹1,500]│ ← Current month with status icon
│ ┌─────────────────────────────────┐ │
│ │ • Rent: ₹1,600                 │ │ ← Current bill in List format
│ │ • Electricity: ₹245            │ │
│ │ • WiFi: ₹30                    │ │
│ │ • Expenses: ₹150               │ │ ← Total expenses amount
│ │   • Repair: ₹100               │ │ ← Individual expense breakdown
│ │   • Maintenance: ₹50           │ │
│ │ • Total: ₹2,025               │ │
│ │ • Amount Paid: ₹525           │ │
│ │ • Outstanding: ₹1,500         │ │
│ │ • Status: Due                  │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ⚠️ Payment Confirmation     │ │ │ ← Amber Alert for UPI
│ │ │ If you pay using UPI, send  │ │ │
│ │ │ screenshot to Rajarshi     │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│       [History (Last 12 Months)]    │ ← Centered, not full width
└─────────────────────────────────────┘
```

### 4.2. Component Specifications

#### 4.2.1. Admin Back Button (Conditional)
- **Visibility**: Only shown when admin is viewing member history
- **Component**: Subtle button with arrow icon, inherits theme default radius
- **Action**: Returns to main members list

#### 4.2.2. Enhanced Header Section
- **Component**: Group with SharedAvatar and single sign-out ActionIcon
- **Avatar**: Uses SharedAvatar component with colorful initials or Google profile image
- **Member Info**: Name prominently displayed with email address below in muted color
- **Sign Out**: Single ActionIcon with logout icon (red color), no dropdown menu
- **Visual Hierarchy**: Clear distinction between member name and email address

#### 4.2.3. Member Navigation Tabs
- **Component**: Mantine SegmentedControl with two options
- **Options**: 
  - **"Me"**: Shows current member's personal dashboard
  - **"Other Members"**: Shows list of other active members (read-only)
- **Default**: "Me" tab selected by default

#### 4.2.4. Member Details Section (Enhanced)
- **Component**: Collapsible Accordion with "My Details" as header
- **Default State**: Collapsed for cleaner interface
- **Content Format**: Unstyled List component with proper spacing
- **Phone Display**: Muted color text (no clickable link styling)
- **Data Source**: Current member's record from `members` collection
- **Progressive Disclosure**: Details available but not overwhelming the main interface

#### 4.2.5. Enhanced Current Month Rent Section
- **Component**: Paper with List formatting instead of bullet points
- **Header Layout**: Month/Year on left, status icon + payment button on right
- **Status Icons**: Consistent with Admin UI (✓✓ overpaid, ✓ paid, ⏱ partial, ✗ due)
- **Payment Button Logic**:
  ```typescript
  // Button disabled for paid/overpaid status
  const isPaymentDisabled = status === 'Paid' || status === 'Overpaid';
  ```
- **Button Text**: "Pay ₹amount" format (no emoji icon inside button)
- **Button State**: Disabled and grayed out when payment not needed
- **UPI Integration**: Opens UPI payment app when clicked (if enabled)
- **List Format**: Consistent spacing and typography using Mantine List component
- **Details**: Complete rent breakdown from `rentHistory` document:
  - **Rent**: Individual rent amount from `rentHistory.rent`
  - **Electricity**: Amount from `rentHistory.electricity` with icon indicator
  - **WiFi**: Amount from `rentHistory.wifi` with WiFi icon
  - **Expenses**: Total amount with individual breakdown from `rentHistory.expenses` array
    - Each expense shows: `amount` and `description` with clear visual separation
  - **Total**: From `rentHistory.totalCharges` - prominently displayed
  - **Amount Paid**: From `rentHistory.amountPaid` with positive color coding
  - **Outstanding**: From `rentHistory.currentOutstanding` with appropriate color coding
  - **Status**: From `rentHistory.status` with status icon and text

#### 4.2.6. UPI Payment Alert System
- **Component**: Amber Alert with info icon
- **Purpose**: Clear instruction for payment confirmation workflow
- **Content**: "If you pay using UPI, please send a screenshot to Rajarshi for confirmation"
- **Visibility**: Always shown after current month details
- **Design**: Non-intrusive amber color scheme for informational alerts

#### 4.2.7. History Section (Enhanced)
- **Button Text**: "History (Last 12 Months)" for clarity
- **Layout**: Centered button (not full width) for better visual balance
- **Styling**: Default variant consistent with theme
- **Future State**: Will expand to show historical rent data accordion

#### 4.2.8. Other Members Section (Enhanced)
- **Avatar Size**: Large size ('lg') consistent with Admin UI
- **Layout Structure**: 
  - Member name at top (medium weight)
  - Phone and floor-room side by side below name
  - All secondary info in muted colors
- **Phone Numbers**: Muted color text (no link styling for privacy)
- **Information Hierarchy**: Clear visual distinction between primary (name) and secondary (contact/location) information

#### 4.2.6. Other Members Section
- **Component**: Simple list showing other active members
- **Data Fields**: From `members` collection where `isActive == true`
  - Shared Avatar component (Google profile or initials)
  - Member name
  - Phone number (clickable tel: link)
  - Floor and bed type
- **Styling**: Clean card layout with member information
- **Interactions**: Read-only display, no actions available
- **Privacy**: Members can only see basic information of other members

### 4.3. Enhanced Status Indicators (High Contrast)
- **Payment Status Colors**: 
  - **Paid**: Strong green (`theme.colors.paid`) - Clear positive feedback
  - **Due**: Strong red (`theme.colors.due`) - Immediate attention required
  - **Partially Paid**: Distinct orange (`theme.colors.partial`) - Clear intermediate status
  - **Overpaid**: Blue accent - Credit balance indication
- **Outstanding Balance Colors**:
  - **Positive (owes)**: Bold red with high contrast
  - **Zero (paid)**: Strong green confirmation
  - **Negative (credit)**: Blue accent for credit balance
- **Badge Design**: Filled badges with high contrast text for maximum readability
- **Visual Weight**: Strong color contrast ensures status is immediately recognizable
- **Accessibility**: Colors meet WCAG contrast requirements for text and background

---

## 5. Admin Dashboard UI

### 5.1. Main Admin Layout
```
┌─────────────────────────────────────┐
│ 🏠 Admin Dashboard          [👤⌄]   │ ← Header with signout
├─────────────────────────────────────┤
│ [Config] [Members] [Rent]           │ ← Main navigation (Admin inside Config)
├─────────────────────────────────────┤
│                                     │
│        [Active Component]           │ ← Dynamic content area lazy loading
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### 5.2. Admin Navigation
- **Navigation Style**: Clean tab-based navigation
- **Active State**: Clear visual indication of current section
- **User Menu**: Dropdown with profile and sign out options
- **Components**: All inherit theme defaults for radius and spacing

### 5.3. Enhanced Config Management Component
```
┌─────────────────────────────────────┐
│ Configuration Management            │
├─────────────────────────────────────┤
│ ⬇️ Admin Management               ⬇️ │ ← Collapsible Accordion (at top)
│ ┌─────────────────────────────────┐ │
│ │ Current Admins:                 │ │
│ │ 👤 Primary Admin (You)          │ │ ← Firebase account holder
│ │ • Full system access            │ │
│ │                                 │ │
│ │ 👤 Secondary Admin        [🗑️] │ │ ← Remove action (primary only)
│ │ • Standard access               │ │
│ │                                 │ │
│ │ Add New Admin:                  │ │
│ │ Email: [📧 admin@example.com]   │ │ ← Email input with validation
│ │ [Add Admin]                     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 2nd Floor                           │ ← H4 heading (no Paper wrapper)
│ [Bed: ₹1,600] [Room: ₹3,200]       │ ← NumberInputs in SimpleGrid
│ [Special: ₹2,400]                   │
│ ────────────────────────────────────│ ← Divider
│ 3rd Floor                           │ ← H4 heading
│ [Bed: ₹1,500] [Room: ₹3,000]       │ ← NumberInputs in SimpleGrid
│ ────────────────────────────────────│ ← Divider
│ General Settings                    │ ← H4 heading
│ [Security: ₹1,600] [WiFi: ₹30]     │ ← NumberInputs in SimpleGrid
│ [UPI: +918777529394]                │
│          [Reset] [Save Changes]     │ ← Action buttons
└─────────────────────────────────────┘
```

#### 5.3.1. Enhanced UX Design Principles Applied
- **Progressive Disclosure**: Admin management collapsed by default to reduce cognitive load on system settings
- **Clean Visual Hierarchy**: Removed Paper wrappers for cleaner, more spacious layout
- **Structured Information Architecture**: 
  - Floor-based grouping with clear H4 headings
  - Logical flow from specific (floors) to general (system settings)
  - Visual separators (Dividers) between logical sections
- **Consistent Layout**: SimpleGrid maintains responsive layout across all input sections
- **Access Control**: Admin management accordion only accessible to primary admin
- **Improved Scanning**: Floor information grouped together for quick configuration
- **Reduced Visual Clutter**: No Paper borders allow content to breathe and reduce visual noise

### 5.4. Members Management Component
```
┌─────────────────────────────────────┐
│ Members Management                  │
├─────────────────────────────────────┤
│ Active Members: 17 | WiFi: 12       │ ← activememberCounts display
│ [🔍 Search] [📊 Filter] [+ Add Member]│ ← SVG icons for space efficiency
├─────────────────────────────────────┤
│ 👤 John Doe          +91XXXXXXXXXX ⋮│ ← Member accordion header
│ ┌─────────────────────────────────┐ │
│ │ Floor: 2nd - Bed              │ │
│ │ Move-in: Jan 15, 2024         │ │
│ │ Current Rent: ₹1,600          │ │
│ │ Outstanding: ₹1,500           │ │ ← outstandingBalance from schema
│ │ Account: Linked               │ │ ← firebaseUid status
│ │ [Edit] [History] [Deactivate] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 👤 Jane Smith        +91XXXXXXXXXX ⋮│
│ (collapsed)                         │
└─────────────────────────────────────┘
```

#### 5.4.1. Member Count Display
- **Active Members**: Real-time count from `activememberCounts.total`
- **WiFi Members**: Real-time count from `activememberCounts.wifiOptedIn`
- **Update Frequency**: Real-time updates via Firestore onSnapshot
- **Styling**: Subtle text above search bar for quick reference

#### 5.4.2. Enhanced Search and Filter with UX Principles
- **Search Input**: 
  - Left section with search SVG icon for immediate recognition
  - Placeholder: "Search by name or phone..." with clear context
  - Debounced search (300ms delay) prevents excessive API calls
  - Clear button (X) appears when search has content
- **Filter Dropdown**: 
  - SVG filter icon for space efficiency and universal recognition
  - Smart grouping: Status (All, Active, Inactive), Account (Linked, Unlinked), Floor (All, 2nd, 3rd)
  - Visual indicators for active filters with count badges
  - Quick filter chips below dropdown for easy removal
- **Loading States**: Skeleton loader while filtering results maintains layout integrity
- **Empty States**: Friendly message with actionable suggestions when no results found

#### 5.4.2.1. UX Improvements Applied
- **Immediate Feedback**: Search results update smoothly without jarring transitions
- **Clear Mental Model**: Filter categories match user's mental organization of data
- **Efficient Scanning**: Results highlight search terms for quick identification
- **Error Prevention**: Clear filter states prevent confusion about why results are limited

### 5.5. Rent Management Component
```
┌─────────────────────────────────────┐
│ Rent Management                     │
├─────────────────────────────────────┤
│ Total Outstanding: ₹12,450          │ ← Prominent display
│                    [Generate Bills] │
├─────────────────────────────────────┤
│ 👤 John Doe          ₹1,500 [Pay]   │ ← Member with outstanding
│ ┌─────────────────────────────────┐ │
│ │ July 2025 - Due               │ │ ← status from rentHistory
│ │ • Rent: ₹1,600                │ │
│ │ • Electricity: ₹245           │ │
│ │ • WiFi: ₹30                   │ │
│ │ • Expenses: ₹150              │ │
│ │   - Repair: ₹100              │ │ ← expenses array breakdown
│ │   - Maintenance: ₹50          │ │
│ │ • Amount Paid: ₹525           │ │ ← Updated from schema
│ │ • Outstanding: ₹1,500         │ │
│ │ [Record Payment] [Add Expense] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 👤 Jane Smith        ₹0 ✓           │ ← Paid member
│ (collapsed)                         │
└─────────────────────────────────────┘
```

---

## 6. Authentication UI

### 6.1. Unified Login Page
```
┌─────────────────────────────────────┐
│                                     │
│            [App Logo]               │
│                                     │
│         Rent Management             │
│                                     │
│    Access your dashboard            │
│  Members view rent information      │
│  Admins manage the system          │
│                                     │
│     [Sign in with Google]           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### 6.2. Authentication Components
- **Layout**: Centered design with consistent spacing
- **Logo**: Prominent app branding
- **Description**: Clear explanation of user roles
- **Google Sign-In**: Primary action button, inherits theme default radius
- **Loading States**: Spinner and skeleton components during authentication

### 6.3. Account Linking Flow

#### 6.3.1. Phone Verification Modal
```
┌─────────────────────────────────────┐
│ Link Your Account                ✕  │ ← Header with close
├─────────────────────────────────────┤
│ Enter your registered phone number  │
│ to access your dashboard            │
│                                     │
│ Phone Number:                       │
│ [+91__________]                     │ ← 10-digit phone input
│                                     │
│ This number should match the one    │
│ registered in the system            │
├─────────────────────────────────────┤
│    [Use Different Account] [Link]   │
└─────────────────────────────────────┘
```

#### 6.3.2. Account Linking States
- **Loading State**: Spinner while verifying phone number
- **Success State**: Redirect to member dashboard
- **Error States**:
  - **Member Not Found**: "Phone number not found in our records"
  - **Account Already Linked**: "This account is already linked to another user"
  - **Invalid Phone**: "Please enter a valid 10-digit phone number"
- **Fallback Action**: "Use Different Account" button for Google sign-out

---

## 7. Shared Modal Specifications

### 7.1. Enhanced Add/Edit Member Modal
```
┌─────────────────────────────────────┐
│ Add New Member                   ✕  │ ← Header with close
├─────────────────────────────────────┤
│ Personal Information                │
│ • Name: [👤 Full Name_______]       │ ← leftSection with person icon
│ • Phone: [📱 +91__________]         │ ← leftSection with phone icon
│ • Move-in Date: [📅 Select date▼]  │ ← Month picker component
│                                     │
│ Location & Rent                     │
│ • Floor: [🏢 2nd▼]                 │ ← leftSection with building icon
│ • Bed Type: [🛏️ Bed▼]              │ ← leftSection with bed icon
│                                     │
│ Financial Details                   │
│ • Rent at Joining: [₹1,600]        │ ← leftSection with currency symbol
│ • Advance Deposit: [₹1,600]        │ ← Auto-filled from config
│ • Security Deposit: [₹1,600]       │ ← Auto-filled from config
│ • Total Deposit: ₹4,800            │ ← Auto-calculated, read-only
│                                     │
│ Options                             │
│ • WiFi: [✓] Opted In               │ ← Checkbox component
├─────────────────────────────────────┤
│              [Cancel] [Add Member]  │ ← Loading overlay during submission
└─────────────────────────────────────┘
```

#### 7.1.1. Enhanced Form Features
- **Input Icons**: All inputs use leftSection with relevant SVG icons
- **Month Picker**: For move-in date selection using Mantine DatePicker
- **Auto-Population**: Financial fields auto-filled from global configuration
- **Real-time Calculation**: Total deposit updates automatically
- **HTML5 Validation**: Proper input types and validation attributes
- **Error Handling**: Server-side errors displayed via notifications
- **Loading State**: Loading overlay prevents double submission

### 7.2. Enhanced Payment Recording Modal
```
┌─────────────────────────────────────┐
│ Record Payment - John Doe        ✕  │
├─────────────────────────────────────┤
│ Current Outstanding: ₹1,500         │
│                                     │
│ Payment Amount:                     │
│ [₹ _______________]                 │ ← Number input with ₹ leftSection
│                                     │
│ Payment Note (optional):            │
│ [💬 Payment details...______]      │ ← Textarea with message icon
│                                     │
│ After Payment: ₹500                 │ ← Auto-calculated with color coding
│ Status: Partially Paid              │ ← Updated payment status
├─────────────────────────────────────┤
│              [Cancel] [Record Payment] │ ← Loading overlay during submission
└─────────────────────────────────────┘
```

#### 7.2.1. Enhanced Payment Features
- **Number Input**: Currency symbol in leftSection for clear amount entry
- **Auto-Calculation**: Real-time calculation of remaining balance
- **Status Update**: Shows updated payment status (Paid/Partially Paid/Overpaid)
- **Color Coding**: Green for paid, yellow for partial, blue for overpaid
- **Validation**: Positive number validation with clear error messages
- **Loading State**: Prevents double submission during processing

### 7.3. Enhanced Generate Bills Modal
```
┌─────────────────────────────────────┐
│ Generate Monthly Bills           ✕  │
├─────────────────────────────────────┤
│ Billing Month:                      │
│ [📅 August 2025 ▼]                 │ ← Month picker component
│                                     │
│ Electricity Bills:                  │
│ ┌─────────────────────────────────┐ │
│ │ 2nd Floor:                      │ │
│ │ Amount: [₹2,450] Members: [10]  │ │ ← Separate editable amount & count
│ │ 3rd Floor:                      │ │
│ │ Amount: [₹1,890] Members: [7]   │ │ ← Both fields are number inputs
│ └─────────────────────────────────┘ │
│                                     │
│ Bulk Expenses (Optional):           │
│ ┌─────────────────────────────────┐ │
│ │ Members: [Select members...▼]   │ │ ← Multi-select with renderOption
│ │ ┌─ Member Selection Dropdown ─┐ │ │
│ │ │ ☐ 👤 John Doe (2nd-Bed)     │ │ │ ← Custom renderOption display
│ │ │ ☑ 👤 Jane Smith (3rd-Room)  │ │ │ ← Shows avatar, name, floor-bed
│ │ │ ☐ 👤 Mike Wilson (2nd-Room) │ │ │ ← Visual member identification
│ │ └─────────────────────────────┘ │ │
│ │ Amount: [₹_______]              │ │ ← Number input with ₹ leftSection
│ │ Description: [_____________]    │ │ ← Text input for expense note
│ │ Type: ○ Individual ● Split      │ │ ← Radio buttons for expense type
│ │ [+ Add Another Expense]         │ │ ← Option to add multiple expenses
│ └─────────────────────────────────┘ │
│                                     │
│ WiFi Members (Auto-selected):       │
│ ┌─────────────────────────────────┐ │
│ │ [Members with WiFi opted...]    │ │ ← Multi-select with renderOption
│ │ ┌─ WiFi Member Selection ─────┐ │ │
│ │ │ ☑ 👤 John Doe (₹2.50)       │ │ │ ← Shows calculated cost per member
│ │ │ ☑ 👤 Jane Smith (₹2.50)     │ │ │ ← Pre-selected from optedForWifi
│ │ │ ☐ 👤 Mike Wilson (opt-out)   │ │ │ ← Option to modify selection
│ │ └─────────────────────────────┘ │ │
│ │ Total WiFi: ₹30 ÷ 12 = ₹2.50   │ │ ← Cost calculation display
│ └─────────────────────────────────┘ │
│                                     │
│ Summary:                            │
│ This will generate bills for 17     │
│ active members with total charges   │
│ of ₹28,950.                        │
├─────────────────────────────────────┤
│        [Cancel] [Generate Bills]    │ ← Loading overlay during generation
└─────────────────────────────────────┘
```

#### 7.3.1. Editable Electricity Bill Member Count
- **Flexible Member Count**: Admin can adjust the number of members for electricity bill calculation on each floor
- **Use Cases**: 
  - Members temporarily away (vacation, business trips)
  - New members joining mid-month
  - Members who opted out of electricity charges
  - Proportional billing based on actual usage
- **Input Validation**: Member count must be between 1 and actual active members on the floor
- **Real-time Calculation**: Per-member cost updates automatically as member count changes
- **Default Values**: Pre-populated with current active member count per floor from `activeMemberCounts`
- **UI Implementation**: Number input with clear visual distinction from amount fields

#### 7.3.2. Enhanced Multi-Select with renderOption
- **Member Identification**: Clear visual representation with avatar, name, and location
- **Contextual Information**: Shows floor-bed type for easy member identification
- **Cost Preview**: WiFi section shows individual cost calculation per member
- **Smart Defaults**: WiFi members pre-selected based on `optedForWifi` status
- **Visual Feedback**: Checkboxes and clear selection state for better UX
- **Accessibility**: Proper ARIA labels and keyboard navigation for multi-select
- **Reference**: [Mantine Multi-Select renderOption](https://mantine.dev/core/multi-select/#renderoption)

### 7.4. Member Deactivation Modal
```
┌─────────────────────────────────────┐
│ Deactivate Member - John Doe     ✕  │
├─────────────────────────────────────┤
│ Leave Date:                         │
│ [📅 Select date ▼]                 │ ← Month picker for leave date
│                                     │
│ ⚠️  Settlement Calculation          │ ← Alert component (orange/yellow)
│ ┌─────────────────────────────────┐ │
│ │ Security Deposit: ₹1,600        │ │
│ │ Advance Deposit: ₹1,600         │ │
│ │ Total Agreed: ₹3,200            │ │
│ │                                 │ │
│ │ Outstanding Balance: ₹1,500     │ │
│ │ Final Settlement: ₹1,700        │ │ ← Refund amount (green if positive)
│ │                                 │ │
│ │ Member will receive ₹1,700      │ │
│ │ after clearing outstanding.     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ This action cannot be undone.       │
│ Member data will be permanently     │
│ deleted after retention period.     │
├─────────────────────────────────────┤
│        [Cancel] [🚨 Deactivate]     │ ← Red deactivate button with warning icon
└─────────────────────────────────────┘
```

### 7.5. Member Deletion Modal (Inactive Members Only)
```
┌─────────────────────────────────────┐
│ Delete Member - Jane Smith       ✕  │
├─────────────────────────────────────┤
│ ⚠️  PERMANENT DELETION              │ ← Red alert component
│ ┌─────────────────────────────────┐ │
│ │ This will permanently delete:   │ │
│ │ • All member data               │ │
│ │ • Complete rent history         │ │
│ │ • Payment records               │ │
│ │                                 │ │
│ │ This action CANNOT be undone.   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ To confirm deletion, type DELETE:   │
│ [_____________________]             │ ← Text input for confirmation
│                                     │
│ Member Status: Inactive since       │
│ March 15, 2025                      │
├─────────────────────────────────────┤
│     [Cancel] [🗑️ Delete Forever]    │ ← Red delete button, disabled until "DELETE" typed
└─────────────────────────────────────┘
```

### 7.6. Add Expense Modal
```
┌─────────────────────────────────────┐
│ Add Expense - John Doe           ✕  │
├─────────────────────────────────────┤
│ Expense Items:                      │
│ ┌─────────────────────────────────┐ │
│ │ Amount: [₹_______]              │ │ ← Number input with ₹ leftSection
│ │ Description: [_______________]  │ │ ← Text input with clear label
│ │                    [🗑️ Remove]  │ │ ← Remove this expense item
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Add Another Expense]             │ ← Button to add more items
│                                     │
│ Total Additional Charges: ₹350      │ ← Auto-calculated total
│ Applied to: July 2025 billing       │ ← Current month clarification
├─────────────────────────────────────┤
│        [Cancel] [Add Expenses]      │ ← Loading overlay during submission
└─────────────────────────────────────┘
```

---

## 8. Technical Implementation Guidelines

### 8.1. Mantine Components
- **Container**: Main layout wrapper (size based on screen)
- **Paper/Card**: All section containers inherit default radius and shadow from theme
- **Accordion**: Collapsible sections with consistent styling via defaultProps
- **Group/Stack**: Layout components with theme-based spacing
- **Button**: All actions inherit default radius from theme
- **Text**: Typography following theme hierarchy
- **Modal**: Shared modal component with blur backdrop, inherits theme defaults
- **Avatar**: Shared avatar component with fallback initials

### 8.2. High-Contrast Theme Implementation
- **Primary Color**: Dark (black) set as primary color for strong visual impact
- **Color Scheme**: Light theme primary with high-contrast elements
- **Button Strategy**: 
  - Black filled buttons for primary actions (`color: 'dark', variant: 'filled'`)
  - Outlined buttons for secondary actions
  - Clear visual hierarchy between action importance
- **Component Styling**:
  ```typescript
  Button: { color: 'dark', variant: 'filled', radius: 'lg' }
  Paper: { withBorder: true, radius: 'lg', shadow: 'lg' }
  Modal: { radius: 'lg', shadow: 'xl' }
  SegmentedControl: { color: 'dark', radius: 'lg' }
  ```
- **Status Colors**: High-contrast variants for payment status
  - Due payments: Strong red tones for immediate attention
  - Paid status: Clear green tones for positive confirmation
  - Partial payments: Distinct orange/yellow for intermediate status
- **Typography**: Clear font weight hierarchy with Nunito Sans
- **Shadows and Borders**: Enhanced depth perception with strategic use of shadows and borders
- **Design References Applied**:
  - High contrast principles from Adham Dannaway's UI tips
  - Clean visual hierarchy following practical UI design patterns
  - Professional appearance with strong visual weight

### 8.3. State Management
- **Authentication**: React Context for user state
- **Real-time Data**: Firestore onSnapshot listeners
- **Local State**: Component-level for UI interactions
- **Loading States**: Skeleton and spinner components

### 8.4. Responsive Design
- **Container Sizing**: `md` for large screens, `sm` for small screens
- **Full Height**: `vh: 100` for main container
- **Adaptive Layout**: Stack components on smaller screens
- **Consistent Spacing**: Theme-based spacing across all breakpoints

---

## 9. Error Handling and User Feedback

### 9.1. Shared Notification System Implementation
- **Centralized Service**: Single notification provider used across all components
- **Position**: Bottom center for optimal visibility without workflow interruption
- **Types**: Error (red), Success (green), Warning (yellow), Info (blue)
- **Duration**: 4 seconds for success, 6 seconds for errors, manual dismiss for critical
- **Retry Actions**: Failed operations include retry buttons with clear call-to-action
- **Queue Management**: Smart stacking prevents notification overflow
- **Context Awareness**: Notifications adapt content based on user's current view

#### 9.1.1. UX Principles from Design Guidelines
- **Immediate Feedback**: Users get instant confirmation of their actions
- **Error Recovery**: Clear paths to resolve issues with actionable retry buttons
- **Visual Consistency**: Standardized colors and positioning reduce cognitive load
- **Non-blocking Design**: Notifications don't interrupt user workflows
- **Progressive Enhancement**: Basic functionality works without notifications

### 9.2. Form Error Handling
- **Client-side Validation**: Real-time validation using HTML5 attributes
- **Server-side Errors**: Display specific field errors from Cloud Functions
- **Loading Overlays**: Applied to forms during submission to prevent double-submission
- **Error Recovery**: Clear error states when user corrects input
- **Success Feedback**: Confirmation notifications for successful operations

### 9.3. Loading States
- **Skeleton Loaders**: For dashboard content, member lists, and history sections
- **Button Loading**: Loading state for action buttons during processing
- **Form Overlays**: Loading overlay for entire forms during submission
- **Real-time Indicators**: Connection status and sync indicators
- **Progress Feedback**: For bulk operations like bill generation

### 9.4. Network and Connection Handling
- **Offline Detection**: Show offline indicator when network is unavailable
- **Retry Mechanisms**: Automatic retry for failed Firestore operations
- **Connection Status**: Visual indicator of Firestore connection state
- **Error Boundaries**: React error boundaries for graceful error handling
- **Fallback UI**: Skeleton states when data is unavailable

### 9.5. Validation and Input Feedback
- **HTML5 Validation**: Required fields, email format, phone number format
- **Real-time Validation**: Immediate feedback on input changes
- **Error Styling**: Red borders and error text for invalid inputs
- **Success Indicators**: Green checkmarks for valid inputs
- **Clear Labels**: Descriptive labels and helper text for all inputs

---

## 10. Accessibility and Performance

### 10.1. Accessibility Features
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: High contrast ratios for text and interactive elements
- **Focus Management**: Clear focus indicators and logical tab order
- **Alternative Text**: Descriptive alt text for all images and icons

### 10.2. Performance Optimizations
- **Lazy Loading**: Admin components loaded only when accessed
- **Image Optimization**: Optimized avatar images and compressed assets
- **Code Splitting**: Separate bundles for admin and member interfaces
- **Memoization**: React.memo for expensive components
- **Efficient Queries**: Optimized Firestore queries with proper indexing

### 10.3. Responsive Design Enhancements
- **Mobile-First**: Designed for mobile devices with progressive enhancement
- **Touch Targets**: Minimum 48px touch targets for mobile interaction
- **Flexible Layout**: Components adapt to various screen sizes
- **Font Scaling**: Responsive typography that scales appropriately
- **Gesture Support**: Touch gestures for mobile navigation

---

This comprehensive design system provides a solid foundation for building a consistent, accessible, and maintainable rent management application using Mantine UI components.
