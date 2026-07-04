# Return Requests Feature

## Overview
Added a complete return request system for delivered orders with a 7-day return window for customers and an admin tracking interface.

## Backend Changes

### Updated Order Model (server.py)
Added return-related fields to the Order model:
- `delivered_at`: Timestamp when order was delivered
- `return_requested`: Boolean flag for return requests
- `return_reason`: User's reason for return
- `return_requested_at`: Timestamp of return request
- `return_status`: Status tracking ('Pending', 'Approved', 'Rejected', 'Processed')
- `admin_return_notes`: Admin's notes on the return

### New API Endpoints

#### 1. Request Return - POST `/api/orders/{order_id}/request-return`
**Purpose**: Allow users to request a return for delivered orders

**Request Body**:
```json
{
  "reason": "Product quality issue or defect"
}
```

**Response**: Updated order object with return request fields

**Validation**:
- Order must be in "Delivered" status
- Return request within 7 days of delivery
- Cannot request return if already requested

#### 2. Get Return Requests - GET `/api/admin/return-requests`
**Purpose**: Admin view all return requests (sorted by newest first)

**Authorization**: Admin only

**Response**: Array of orders with `return_requested: true`

#### 3. Update Return Status - PUT `/api/admin/return-requests/{order_id}`
**Purpose**: Admin updates the status of a return request

**Request Body**:
```json
{
  "return_status": "Approved",
  "notes": "Approved for return. Please ship back to warehouse."
}
```

**Valid Statuses**:
- `Pending`: Initial state
- `Approved`: Return approved
- `Rejected`: Return rejected
- `Processed`: Return completed

## Frontend Changes

### Orders Page (Orders.jsx)

#### New State Variables
- `returnDialogOpen`: Controls return request dialog
- `returningOrderId`: Selected order for return
- `returnReason`: User's return reason text

#### New Functions
- `handleRequestReturn()`: Submits return request to backend
- `isReturnWindowOpen()`: Checks if 7 days have passed since delivery

#### UI Changes
1. **Return Button** - Visible for 7 days after delivery on delivered orders
2. **Return Request Dialog** - Modal for users to input return reason
3. **Return Status Display** - Shows return status and reason on order details
4. **Admin Return Notes** - Displays admin's notes if provided

### Admin Dashboard (AdminDashboard.jsx)

#### New State Variables
- `returnRequests`: Array of return requests
- `returnStatusDialogOpen`: Controls status update dialog
- `selectedReturnOrder`: Currently selected return request
- `returnStatusValue`: Selected status
- `returnNotes`: Admin notes

#### New Tab: "Returns"
Shows all return requests with:
- Order ID and customer email
- Return reason
- Current status (with color coding)
- Request date
- Update Status button with indicator badge

#### Return Status Dialog
Allows admin to:
- Change return status (Pending → Approved/Rejected/Processed)
- Add notes/comments
- Save changes with immediate feedback

## Features

### For Customers
1. ✅ Request return within 7 days of delivery
2. ✅ Provide reason for return
3. ✅ Track return status (Pending/Approved/Rejected/Processed)
4. ✅ View admin notes on their return
5. ✅ Only one return request per order

### For Admin
1. ✅ View all return requests in one place
2. ✅ Filter by return status
3. ✅ See customer reason and order details
4. ✅ Update return status with admin notes
5. ✅ Track return requests sorted by newest first
6. ✅ Badge showing pending return count

## Data Flow

### Return Request Creation
```
Customer clicks "Request Return" 
→ Dialog opens (valid only if delivered & within 7 days)
→ User enters reason
→ POST /api/orders/{id}/request-return
→ Backend validates and updates order
→ Order list refreshes
```

### Admin Processing
```
Admin views "Returns" tab
→ Sees all orders with return_requested = true
→ Clicks "Update Status"
→ Dialog opens showing current status
→ Selects new status and adds notes
→ PUT /api/admin/return-requests/{id}
→ Order updates with new status
→ Return requests list refreshes
```

## Database Schema

Return-related fields stored in orders collection:
```python
{
  "id": "...",
  "customer_email": "...",
  "status": "Delivered",
  "delivered_at": "2024-01-18T10:00:00Z",
  "return_requested": true,
  "return_reason": "Size doesn't fit",
  "return_requested_at": "2024-01-19T14:30:00Z",
  "return_status": "Pending",
  "admin_return_notes": "Customer approved for return"
}
```

## Validation Rules

1. **Return Window**: Only within 7 days of `delivered_at`
2. **Status**: Only for orders with status = "Delivered"
3. **One Per Order**: Can't request multiple returns for same order
4. **Admin Status**: Only admin can update return status

## Future Enhancements

Possible additions:
- Return shipping labels generation
- Refund processing integration
- Return tracking/timeline
- Return reason analytics
- Auto-expire old returns
- Bulk return actions
