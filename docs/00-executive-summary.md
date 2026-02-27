# EIMS Executive Summary

## Document Purpose

This executive summary provides a comprehensive overview of the Equipment & Inventory Management System (EIMS) migration project. It serves as a single-source reference for stakeholders, developers, and project managers to understand the system's scope, architecture, and migration strategy.

---

## 1. System Overview

### Quick Facts

| Attribute | Details |
|-----------|---------|
| **System Name** | Equipment & Inventory Management System (EIMS) |
| **System Type** | Web-based Inventory & Equipment Tracking |
| **Current Stack** | Django 5.0 + Vue 3 |
| **Target Stack** | Next.js 14+ with Server Actions |
| **User Roles** | 8 distinct roles with RBAC |
| **Core Modules** | 5 modules (Users, Secretary, Labtech, Supply, Staff) |
| **Database Tables** | ~25 models across all modules |
| **API Endpoints** | 80+ RESTful endpoints |
| **Concurrent Users** | 50-100 users (designed capacity) |
| **Deployment** | Educational institution environment |

### System Purpose

EIMS manages equipment, inventory, and chemical supplies across multiple departments in an educational institution. The system supports complex workflows including:
- Equipment borrowing and returns with condition tracking
- Chemical inventory management with expiry monitoring
- Laboratory apparatus and equipment tracking
- Equipment lifecycle management (transfer, replace, dispose)
- Multi-role access control with department-based permissions
- Barcode-based tracking for all assets and users

---

## 2. System Architecture

### Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Vue 3 Frontend (Port 8080)                              │  │
│  │  - Vue Router 4 (SPA routing)                              │  │
│  │  - Pinia + Vuex (State management)                       │  │
│  │  - Axios (HTTP client)                                    │  │
│  │  - Tailwind CSS (Styling)                                 │  │
│  │  - Chart.js, ApexCharts (Visualizations)                 │  │
│  │  - Quagga2, ZXing (Barcode scanning)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/HTTPS
                              ↓ CORS Enabled
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Django 5.0 Backend (Port 8000)                          │  │
│  │  - Django REST Framework (API)                           │  │
│  │  - Token Authentication                                   │  │
│  │  - Role-based Permissions                                │  │
│  │  - WhiteNoise (Static files)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQLite (Development) / MySQL (Production)               │  │
│  │  - 25+ tables across 5 modules                           │  │
│  │  - Django ORM for queries                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Cloudinary CDN                                          │  │
│  │  - User profile pictures                                 │  │
│  │  - Equipment/item barcodes (Code128)                     │  │
│  │  - Category images                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Vue Component → Axios Request → Django View
                                                    ↓
                                            Permission Check
                                                    ↓
                                            Business Logic
                                                    ↓
                                            Django ORM Query
                                                    ↓
                                            SQLite/MySQL
                                                    ↓
                                            Serialize Response
                                                    ↓
User Interface ← JSON Response ← DRF Serializer ← Django View
```

---

## 3. Core Modules Summary

### 3.1 Users Module

**Purpose**: User authentication, authorization, and organizational structure

**Key Features**:
- Token-based authentication with Django REST Framework
- 8 distinct user roles with granular permissions
- Department and room management
- User barcode generation (Code128 format)
- Profile management with Cloudinary integration
- Auto-generated custom IDs for tracking

**Data Models**: `User`, `Department`, `Room`

**Key Workflows**:
- User registration and role assignment
- Department/room creation and assignment
- Barcode generation on user creation
- Password reset and profile updates

### 3.2 Secretary Module

**Purpose**: General equipment and item management for non-laboratory items

**Key Features**:
- Item catalog with categories
- Consumables vs Non-Consumables distinction
- Item instance tracking (individual units)
- Borrowing workflow with room assignment
- Return processing with condition tracking
- Damage reporting and history
- Barcode scanning for quick identification

**Data Models**: `Item`, `ItemInstance`, `Category`, `BorrowRecord`, `ReturnRecord`

**Business Logic**:
- **Consumables**: Single instance with quantity field, auto-return on borrow
- **Non-Consumables**: Individual instances (quantity=1), manual return required
- Condition tracking: Good → Fair → Poor → Damaged
- Borrow records link borrower, item, room, and purpose

### 3.3 Labtech Module

**Purpose**: Laboratory equipment, apparatus, and chemical management

**Key Features**:
- Equipment management (computers, projectors, lab devices)
- Apparatus management (glassware, tools, lab supplies)
- Chemical inventory with volume tracking
- Chemical usage recording with subject/room assignment
- Expiry date monitoring for chemicals
- Low stock alerts (reorder levels)
- Equipment status tracking (Active/Inactive)
- Subject and lab category management

**Data Models**: `Equipment`, `EquipmentInstance`, `Apparatus`, `ApparatusInstance`, `Chemical`, `ChemicalStock`, `ChemicalUsage`, `Subject`, `LabCategory`, `Unit`

**Business Logic**:
- Equipment instances have Active/Inactive status
- Chemicals tracked by volume with multiple stock batches
- Expiry filtering: only non-expired stocks available
- Chemical usage deducts from oldest non-expired stock first (FIFO)
- Reorder alerts when total volume < reorder_level

### 3.4 Supply Module

**Purpose**: Supply office operations and chemical distribution

**Key Features**:
- Chemical assignment to users/rooms
- Volume-based distribution tracking
- Assignment history and audit trail
- Integration with chemical inventory

**Data Models**: `ChemicalAssignment`

**Business Logic**:
- Assignments link chemical stocks to users and rooms
- Volume tracking for distributed chemicals
- Assignment records maintained for accountability

### 3.5 Staff Module

**Purpose**: Staff equipment requests and lifecycle management

**Key Features**:
- Transfer requests (move equipment between users/locations)
- Replace requests (request equipment replacement)
- Dispose requests (request equipment disposal)
- Multi-stage approval workflows
- Request status tracking
- Assignee confirmation for transfers

**Data Models**: `TransferRequest`, `ReplaceRequest`, `DisposeRequest`, `Status`

**Business Logic**:
- Transfer workflow: Request → Assignee Confirmation → Admin Approval → Completed
- Status transitions: AWAITING_ASSIGNEE_CONFIRMATION → PENDING → APPROVED/REJECTED
- Assignee can reject transfers before admin review
- All requests require admin approval

---

## 4. User Roles & Permissions

| Role | Code Flag | Responsibilities | Key Permissions |
|------|-----------|------------------|-----------------|
| **Superuser** | `is_superuser` | Full system access | All CRUD operations, system configuration |
| **Admin** | `is_admin` | User & system management | User management, department/room CRUD, approve requests |
| **Secretary** | `is_secretary` | General equipment management | Item CRUD, borrowing/returns, category management |
| **Lab Technician** | `is_labtech` | Laboratory operations | Equipment/apparatus/chemical CRUD, lab borrowing workflows |
| **ICT Technician** | `is_ictc` | ICT equipment management | ICT equipment tracking and maintenance |
| **Supply Office** | `is_supply` | Supply distribution | Chemical assignments, equipment assignments |
| **Dean** | `is_dean` | Oversight & reporting | View all reports, assigned equipment tracking |
| **Staff** | `is_staff` | Equipment usage | Borrow equipment, submit transfer/replace/dispose requests |

**Permission Model**: Role-based flags on User model (boolean fields)

---

## 5. Key Workflows

### 5.1 Equipment Borrowing Workflow

**Steps**:
1. User scans their barcode (authentication)
2. System verifies user identity and permissions
3. User scans equipment barcode(s)
4. System checks equipment availability
5. User selects destination room and enters purpose
6. System creates BorrowRecord with timestamp
7. System updates equipment status to "borrowed"
8. Confirmation displayed with borrow details

**Validation**:
- Equipment must be available (not currently borrowed)
- User must have borrowing permissions
- Room must exist and be accessible
- For consumables: quantity must be available

### 5.2 Equipment Return Workflow

**Steps**:
1. User scans equipment barcode
2. System finds active BorrowRecord
3. User confirms return and reports condition
4. System creates ReturnRecord with timestamp
5. System updates BorrowRecord.return_date
6. System updates equipment condition if changed
7. System marks equipment as available
8. Return confirmation displayed

**Validation**:
- Active borrow record must exist
- User must have return permissions
- Condition must be valid (Good/Fair/Poor/Damaged)

### 5.3 Chemical Usage Workflow

**Steps**:
1. User requests chemical by name/barcode
2. System displays available non-expired stocks
3. User specifies quantity, subject, room, and purpose
4. System validates quantity against available stock
5. System creates ChemicalUsage record
6. System deducts quantity from oldest non-expired stock (FIFO)
7. System checks if remaining volume < reorder_level
8. If low stock, system displays alert
9. Usage confirmation with remaining stock info

**Validation**:
- Chemical stock must exist and not be expired
- Requested quantity ≤ available volume
- Subject and room must be valid

### 5.4 Equipment Transfer Workflow

**Steps**:
1. Staff submits transfer request (equipment, new assignee, new location, reason)
2. System creates TransferRequest with status: AWAITING_ASSIGNEE_CONFIRMATION
3. New assignee receives notification
4. Assignee accepts or rejects:
   - Accept → Status: PENDING (awaits admin approval)
   - Reject → Status: ASSIGNEE_REJECTED (request closed)
5. If pending, admin reviews request
6. Admin approves or rejects:
   - Approve → Status: APPROVED, equipment reassigned
   - Reject → Status: REJECTED (request closed)
7. All parties notified of final decision

**Validation**:
- Equipment must exist and be assigned
- New assignee must be valid user
- New location must be valid room
- Only admins can approve/reject after assignee acceptance

---

## 6. Data Model Summary

### Model Count by Module

| Module | Models | Key Relationships |
|--------|--------|-------------------|
| **Users** | 3 | User ↔ Department, Department ↔ Room |
| **Secretary** | 5 | Item → ItemInstance → BorrowRecord → ReturnRecord |
| **Labtech** | 10 | Equipment/Apparatus/Chemical → Instances → Usage/Borrow Records |
| **Supply** | 1 | ChemicalAssignment → Chemical, User, Room |
| **Staff** | 4 | TransferRequest/ReplaceRequest/DisposeRequest → Equipment/User |
| **Total** | **~25** | Complex many-to-one and one-to-many relationships |

### Entity Relationship Overview

```