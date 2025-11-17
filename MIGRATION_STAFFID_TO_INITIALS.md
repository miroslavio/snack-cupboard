# Migration: StaffID to Initials

## Status: IN PROGRESS

This migration changes the primary identifier for staff members from `staffId` to `initials`.

## Completed Changes

### Backend
- ✅ `server/database.js`: Updated schema to use `initials` as UNIQUE identifier, added migration code for existing databases
- ✅ `server/routes/staff.js`: Updated all routes to use `initials` parameter instead of `staffId`
  - GET, POST, PUT, DELETE routes
  - CSV import (now expects: Initials, Surname, Forename)
  - Bulk operations (archive, restore, delete-permanent)
- ✅ `server/routes/purchases.js`: Updated to use `staffInitials` field instead of `staffId`
  - POST, GET, PUT routes
  - CSV export
  - Summary by staff

### Database Migration
- Schema updated for new installations
- Migration code handles existing databases:
  - Adds `staffInitials` column to purchases table
  - Copies initials from staff table to purchases
  - Retains old `staffId` columns for safety (can be manually dropped later)

## Remaining Changes

### Frontend Components

#### 1. StaffManagement.jsx
Replace all instances:
- `newStaffId` → `newInitials` (remove staff ID input field entirely)
- `staffId` → `initials` in API calls
- `selectedStaffIds` → `selectedInitials`
- `staffIds` → `staffInitials` in bulk operations
- Update form to remove StaffID field, keep only: Initials, Forename, Surname
- Update CSV import placeholder text
- Update table column headers and display

#### 2. UserSelection.jsx  
Replace:
- `staffId` → `initials` when passing to checkout
- Update any display or selection logic

#### 3. PurchasesManagement.jsx
Replace:
- `staffId` → `staffInitials` in state and API calls
- Update purchase records display

#### 4. README.md
Update CSV format examples:
- Staff CSV: Remove StaffID column, show: `Initials,Surname,Forename`

## Testing Checklist

- [ ] Staff CRUD operations (add, edit, delete, restore)
- [ ] Staff CSV import (both replace and append modes)
- [ ] Staff bulk operations (archive, restore, delete)
- [ ] Staff search and filtering
- [ ] Purchase creation with staff selection
- [ ] Purchase history display
- [ ] Purchase CSV export
- [ ] Staff spending summary
- [ ] Archived staff visibility and operations

## Rollback Plan

If issues occur:
1. Backend routes still work with old data (migration preserves staffId columns)
2. Can revert backend routes to use staffId again
3. Frontend can be reverted independently
4. Database migration is additive (doesn't drop columns)

## Notes

- Initials must be unique per staff member
- Old databases automatically migrated on server start
- CSV import format changed (no longer requires StaffID)
- More intuitive for users who identify staff by initials
