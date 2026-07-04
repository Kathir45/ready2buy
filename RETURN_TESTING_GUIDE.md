# Return Requests Feature - Testing Guide

## How to Test the Return Feature

### Step 1: Deliver an Order
1. Go to Admin Dashboard → Orders tab
2. Find an order with status "Processing", "WhatsApp Sent", or "Confirmed"
3. Click the dropdown and change status to "Delivered"
4. In the update dialog, set `delivered_at` to today's date
5. Save the order

### Step 2: User Requests Return
1. Login as customer (user who placed the order)
2. Go to Orders page
3. Find the "Delivered" order
4. You should see a **"Request Return (7 Days)"** button
5. Click it and a dialog opens
6. Enter a reason (e.g., "Product quality issue", "Doesn't fit", etc.)
7. Click "Submit Return Request"
8. Success! The order now shows return status

### Step 3: Admin Processes Return
1. Login to Admin Dashboard
2. Click the **"Returns"** tab (shows pending return count)
3. You'll see a table with:
   - Order ID
   - Customer email
   - Return reason
   - Current status (Pending/Approved/etc.)
   - Requested date
   - Update Status button

4. Click "Update Status"
5. In the dialog:
   - Change status to "Approved", "Rejected", or "Processed"
   - Add optional notes (e.g., "Approved for return, ship to warehouse")
6. Click "Update Status"
7. Table refreshes showing new status

### Step 4: Customer Sees Return Status
1. Customer goes back to Orders page
2. Clicks "View Details" on the order
3. In order details, see return section showing:
   - Return Status (e.g., "Approved")
   - Original reason
   - Admin notes (if any)
   - Date of request

## Return Window Rules

### 7-Day Window
- Return button only appears for 7 days after delivery
- After 7 days, "Request Return" button is hidden
- Backend enforces this validation

### Valid Return Scenarios
✅ Day 1 after delivery - Can request return
✅ Day 5 after delivery - Can request return  
✅ Day 7 after delivery - Can request return
❌ Day 8 after delivery - Cannot request return (too late)
❌ Not delivered yet - Cannot request return
❌ Already returned - Cannot request again

## Test Cases

### Test 1: Happy Path
```
1. Order delivered today → Request return immediately
2. Admin sees pending return request
3. Admin approves return
4. Customer sees approved status ✓
```

### Test 2: Return Window Expired
```
1. Order delivered 8 days ago
2. Customer views order
3. "Request Return" button should NOT appear
4. Error if trying via API ✓
```

### Test 3: Admin Rejection
```
1. Customer requests return
2. Admin rejects return with note "Not eligible"
3. Customer sees "Rejected" status with admin's note ✓
```

### Test 4: Return Processing
```
1. Return approved by admin
2. Admin changes status to "Processed" when return received
3. Order timeline shows return processed ✓
```

## API Testing (with curl)

### Request Return
```bash
curl -X POST http://localhost:8000/api/orders/{order_id}/request-return \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Item damaged in shipping"}'
```

### Get All Returns (Admin)
```bash
curl -X GET http://localhost:8000/api/admin/return-requests \
  -H "Authorization: Bearer {admin_token}"
```

### Update Return Status (Admin)
```bash
curl -X PUT http://localhost:8000/api/admin/return-requests/{order_id} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "return_status": "Approved",
    "notes": "Approved for return. RMA: RMA-123456"
  }'
```

## Error Handling

### Expected Errors

1. **"Order not found"**
   - Check order ID is correct
   - Verify you're logged in

2. **"Can only request returns for delivered orders"**
   - Order must have status = "Delivered"
   - Try on a delivered order instead

3. **"Return window closed. Only 7 days allowed after delivery"**
   - Too much time passed since delivery
   - Create a new test order

4. **"Return already requested for this order"**
   - Already submitted return for this order
   - Can't request twice per order

5. **"Admin access required"**
   - Only admin can view/update returns
   - Login with admin account

## UI Elements to Check

### Orders Page
- [ ] Return button appears on delivered orders within 7 days
- [ ] Return dialog opens when button clicked
- [ ] Can enter multi-line return reason
- [ ] Success toast shows "Return request submitted"
- [ ] Order list refreshes after return request
- [ ] Return info shows in order details (status, reason, notes)

### Admin Dashboard
- [ ] Returns tab visible and accessible
- [ ] Badge shows count of pending returns
- [ ] Return requests table shows all returns
- [ ] Status color coding works (warning for pending, etc.)
- [ ] Update Status button opens dialog
- [ ] Can change status and add notes
- [ ] Table refreshes after update

## Data to Verify in Database

### MongoDB - orders collection
```javascript
// Find returned orders
db.orders.find({ return_requested: true })

// Should show:
{
  "id": "...",
  "return_requested": true,
  "return_reason": "...",
  "return_requested_at": "...",
  "return_status": "Pending",
  "delivered_at": "...",
  "admin_return_notes": "..."
}
```

## Known Limitations

1. Return shipping labels not auto-generated (manual process)
2. Refund processing is separate (not automated)
3. Return inventory not auto-added back to stock
4. No return inspection workflow
5. No email notifications to customer on status change

These can be added in future iterations.
