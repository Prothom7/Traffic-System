# Vehicle Services Pipeline

This document describes the implemented backend + frontend pipeline for vehicle services.

## Data Models (MongoDB via Mongoose)

### renewal_requests (RenewalRequest)
- request_number: number, unique
- userId: ObjectId -> User
- vehicleId: ObjectId -> Vehicle
- status: pending | approved | rejected
- months_remaining_at_request: number
- current_registration_expiry: Date
- requested_registration_expiry: Date
- adminId: ObjectId -> User (admin)
- admin_note: string
- decided_at: Date
- payment_required: boolean
- payment_status: not_required | pending | success | failed
- timestamps

### ownership_change_requests (OwnershipChangeRequest)
- request_number: number, unique
- userId: ObjectId -> User
- vehicleId: ObjectId -> Vehicle
- status: pending | approved | rejected
- new_owner_user_id: ObjectId -> User (optional)
- new_owner_name, new_owner_email, new_owner_contact, new_owner_address
- adminId: ObjectId -> User (admin)
- admin_note: string
- decided_at: Date
- transferred_at: Date
- timestamps

### stolen_vehicles (StolenVehicle)
- vehicleId: ObjectId -> Vehicle, unique (prevents duplicate reports)
- reported_by_user_id: ObjectId -> User
- incident_date: Date
- incident_location: string
- police_report_number: string
- additional_info: string
- status: open | recovered
- timestamps

### payments (Payment)
- user_id: ObjectId -> User
- vehicle_id: ObjectId -> Vehicle
- request_type: renewal
- request_id: ObjectId -> RenewalRequest
- request_model: RenewalRequest
- amount: number
- status: pending | success | failed
- payment_method: string
- gateway_reference: string
- paid_at: Date
- timestamps
- unique index on (request_type, request_id) to prevent duplicate payment records per request

## Ownership and Authorization Rules

- Auth required for all service routes.
- Users can only select and act on their own vehicles.
- Renewal eligibility is strictly enforced: vehicle must have less than 90 days remaining.
- Admin-only approval endpoints are protected.
- Payment creation is only triggered after admin approval of a renewal request.
- Renewal payment completion updates vehicle registration expiry.

## API Summary

### User APIs

- `GET /api/services/my-vehicles`
  - Returns only the authenticated user's vehicles.
  - Includes renewal eligibility metadata.

- `POST /api/services/renew-registration`
  - Body: `{ "number_plate": "ABC-1234" }`
  - Creates a pending renewal request if vehicle is eligible (2-3 months remaining).

- `GET /api/services/renew-registration`
  - Returns user's renewal requests.

- `POST /api/services/change-ownership`
  - Body: `{ "number_plate": "ABC-1234", "new_owner_name": "...", "new_owner_email": "...", "new_owner_contact": "...", "new_owner_address": "..." }`
  - Creates pending ownership transfer request.

- `GET /api/services/change-ownership`
  - Returns user's ownership requests.

- `POST /api/services/report-stolen`
  - Body: `{ "number_plate": "ABC-1234", "incident_date": "2026-04-23", "incident_location": "Dhaka", "police_report_number": "PR-99", "additional_info": "..." }`
  - Inserts record into stolen_vehicles and marks vehicle status as Stolen.

- `GET /api/services/report-stolen`
  - Returns user's stolen vehicle reports.

- `GET /api/services/check-status?number_plate=ABC-1234`
  - Returns status only for authenticated user's own vehicle.

- `GET /api/payments/history?all=true`
  - For regular users: returns only own payments.
  - For admins: returns all payments.

- `POST /api/payments/service`
  - Legacy compatibility endpoint for payment confirmation.

- `POST /api/payments/initiate`
  - Body: `{ "request_id": "<renewalRequestId>", "amount": 1500 }`
  - Creates a pending payment (or returns existing) for approved renewal requests.

- `POST /api/payments/confirm`
  - Body: `{ "payment_id": "<paymentObjectId>", "payment_method": "mock_gateway" }`
  - Marks payment success and updates registration validity.

### Admin APIs

- `GET /api/admin/services/renewals`
- `PATCH /api/admin/services/renewals`
  - Body: `{ "request_id": "<id>", "status": "approved" | "rejected", "admin_note": "...", "amount": 1500 }`
  - On approve, creates linked payment record with pending status.

- `GET /api/admin/services/ownership-requests`
- `PATCH /api/admin/services/ownership-requests`
  - Body: `{ "request_id": "<id>", "status": "approved" | "rejected", "admin_note": "..." }`
  - On approve, transfers vehicle ownership to registered target owner.

## Example Responses

### Renewal request success
```json
{
  "success": true,
  "message": "Renewal request submitted and pending admin approval",
  "data": {
    "_id": "...",
    "status": "pending",
    "payment_status": "not_required"
  }
}
```

### Renewal approval success
```json
{
  "success": true,
  "message": "Renewal approved. Payment has been created and is now required.",
  "data": {
    "request": { "_id": "...", "status": "approved", "payment_status": "pending" },
    "payment": { "_id": "...", "status": "pending", "amount": 1500 }
  }
}
```

### Service payment success
```json
{
  "success": true,
  "message": "Payment completed and registration has been renewed",
  "data": {
    "payment": { "_id": "...", "status": "success" },
    "new_registration_expiry": "2027-06-01T00:00:00.000Z"
  }
}
```

## Frontend Flow Implemented

- Explore page links into service pages.
- Renew Registration page:
  - Loads only own vehicles.
  - Shows eligibility and disables non-eligible vehicles.
  - Submits pending request.
  - Shows request history and payment status.

- Change Ownership page:
  - Loads own vehicles only.
  - Submits pending request with new owner details.
  - Shows request history and statuses.

- Report Stolen page:
  - Loads own non-stolen vehicles only.
  - Submits report and displays report history.

- Payment History page:
  - Lists payments (own for user, all for admin).
  - Provides Pay Now for pending approved renewal payments.

- Admin Service Requests page:
  - View/approve/reject renewal requests.
  - View/approve/reject ownership requests.
  - View all payment transactions.
