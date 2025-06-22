# MEMBERS FEATURE UI MAP
*Generated: June 22, 2025*

## COMPONENT HIERARCHY

```
AdminDashboard
└── MembersSection (when activeSection === 'members')
    ├── StudentModal (Add/Edit)
    └── DeleteStudentModal (Delete/Deactivate)
```

## DETAILED UI STRUCTURE

### 1. MembersSection.tsx - Main Container

#### Layout Structure
```
Stack (vertical layout)
├── Statistics Panel (Card)
│   └── Group (horizontal)
│       ├── Total Active Members Badge
│       └── WiFi Opted Students Badge
│
├── Action Controls (Group)
│   ├── Search Input (TextInput with IconSearch)
│   └── Controls Group
│       ├── Add Student Button (IconUserPlus)
│       └── Sort & Filter Menu (IconAdjustments)
│           ├── Sort by: Name, Floor
│           └── Show: Active, Deleted
│
└── Students List (Stack)
    ├── Results Count Text
    └── Accordion (multiple, separated)
        └── [For each student] Accordion.Item
            ├── Accordion.Control
            │   ├── Avatar (student initial)
            │   ├── Student Name
            │   └── Badges (Floor, Active/Deleted)
            ├── Actions Menu (IconDots)
            │   ├── Edit (IconEdit)
            │   └── Delete (IconTrash, red)
            └── Accordion.Panel
                └── Student Details List
                    ├── Phone (clickable tel: link)
                    ├── Bed Type
                    ├── Move-in Date
                    ├── Current Rent
                    ├── Security Deposit
                    ├── Advance Deposit
                    ├── WiFi Status Badge
                    └── Outstanding Balance (colored)
```

#### Props Interface
```typescript
interface MembersSectionProps {
  students: Student[]
  loading: boolean
}
```

#### State Management
```typescript
const [searchQuery, setSearchQuery] = useState("")
const [sortBy, setSortBy] = useState<"Name" | "Floor">("Name")
const [showFilter, setShowFilter] = useState<"Active" | "Deleted">("Active")
const [modalOpen, setModalOpen] = useState(false)
const [editingStudent, setEditingStudent] = useState<Student | null>(null)
const [deleteModalOpen, setDeleteModalOpen] = useState(false)
const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
```

### 2. StudentModal.tsx - Add/Edit Form

#### Layout Structure
```
Modal (size='lg')
├── Modal Header: "Add New Student" | "Edit Student"
├── LoadingOverlay (when configLoading)
└── Modal Body (Stack)
    ├── Student Name (TextInput, required)
    ├── Phone Number (NumberInput, required, 10 digits)
    ├── Move-in Date (MonthPickerInput, required)
    ├── Floor & Bed Type (Group of Select components)
    ├── Current Rent (NumberInput with prefix ₹)
    ├── Security Deposit (NumberInput, new students only)
    ├── Rent at Joining (NumberInput, new students only)
    ├── Advance Deposit (NumberInput, auto-calculated, disabled)
    ├── [New Students Only] Payment Section
    │   ├── Total Deposit Alert
    │   ├── Full Payment Switch
    │   └── [If not full] Actual Amount Paid Input
    └── Action Buttons (Group)
        ├── Cancel Button
        └── Save Button (loading state)
```

#### Props Interface
```typescript
interface StudentModalProps {
  opened: boolean
  onClose: () => void
  editingStudent: Student | null
  hasOnlyOneRentHistory?: boolean
}
```

#### Form Data Structure
```typescript
interface FormData {
  name: string
  phone: string
  floor: string
  bedType: string
  moveInDate: Date
  rentAtJoining: number
  currentRent: number
  securityDeposit: number
  advanceDeposit: number
  actualAmountPaid: number
}
```

#### Validation Rules
- **Name**: Required, min 2 words (first + last name)
- **Phone**: Required, exactly 10 digits, starts with 6-9
- **Floor**: Required, from config
- **Bed Type**: Required, based on selected floor
- **Amount Paid**: If partial payment, must be > 0 and ≤ total deposit

### 3. DeleteStudentModal.tsx - Deactivation Confirmation

#### Layout Structure
```
Modal (size='md', centered)
├── Modal Header: "Delete Student"
└── Modal Body (Stack)
    ├── Student Info (Group)
    │   ├── Avatar (large)
    │   └── Student Details (Stack)
    │       ├── Name
    │       ├── Phone
    │       └── Floor & Bed Type Badge
    ├── Divider
    ├── Financial Summary (Stack)
    │   ├── Section Header with Loading indicator
    │   ├── Total Deposit Agreed
    │   ├── Current Outstanding Balance
    │   ├── Settlement Status Badge
    │   └── Refund/Due Amount (colored)
    ├── Divider
    ├── Leave Date Picker (DatePickerInput)
    └── Action Buttons (Group)
        ├── Cancel Button
        └── Delete Button (red, loading state)
```

#### Props Interface
```typescript
interface DeleteStudentModalProps {
  opened: boolean
  onClose: () => void
  student: Student | null
}
```

#### Settlement Preview Structure
```typescript
interface SettlementPreview {
  studentName: string
  totalDepositAgreed: number
  currentOutstandingBalance: number
  refundAmount: number
  status: string
  leaveDate: string
}
```

## UI/UX PATTERNS

### Color Coding
- **Green**: Active students, paid status, credit balance
- **Red**: Deleted students, outstanding balance, debt
- **Blue**: Primary actions, WiFi opted
- **Gray**: Inactive/neutral status
- **Orange/Yellow**: Warnings, partial payments

### Icon Usage
- **IconUserPlus**: Add student
- **IconEdit**: Edit student
- **IconTrash**: Delete student
- **IconDots**: More actions menu
- **IconPhone**: Phone number
- **IconSearch**: Search functionality
- **IconAdjustments**: Sort & filter
- **IconCheck**: Selected options
- **IconCalendar**: Date picker

### Loading States
- **Skeleton/Loader**: Main data loading
- **LoadingOverlay**: Modal operations
- **Button Loading**: Save/delete operations
- **Spinner**: Settlement preview calculation

### Responsive Behavior
- **Desktop**: Full accordion layout with all details
- **Mobile**: Stacked layout, collapsible sections
- **Tablet**: Medium layout with adjusted spacing

## ACCESSIBILITY FEATURES

### Keyboard Navigation
- Tab order: Search → Add → Filter → Student items → Actions
- Arrow keys: Navigate within menus
- Enter/Space: Activate buttons and toggles
- Escape: Close modals and menus

### Screen Reader Support
- ARIA labels on all action buttons
- Role attributes for interactive elements
- Descriptive text for status indicators
- Form field labels and validation messages

### Focus Management
- Auto-focus on modal open
- Return focus on modal close
- Visible focus indicators
- Skip links for navigation

## DATA FLOW

### Real-time Updates
1. `AdminDashboard` fetches students via `useRealtimeStudents`
2. Students array passed to `MembersSection`
3. UI updates automatically on Firestore changes
4. Statistics recalculate on data changes

### CRUD Operations
1. **Add**: StudentModal → addStudent() → Firestore → Real-time update
2. **Edit**: StudentModal → updateStudent() → Firestore → Real-time update  
3. **Delete**: DeleteStudentModal → deleteStudentWithSettlement() → Firestore → Real-time update

### State Synchronization
- Modal state independent of main component
- Form validation state within modals
- Loading states prevent concurrent operations
- Error states provide user feedback

---
*This UI map documents the complete structure and behavior of the Members feature interface.*
