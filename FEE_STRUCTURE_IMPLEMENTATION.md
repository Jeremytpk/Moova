# Moova Fee Structure Implementation

## Overview

The Moova platform now has a complete fee structure that generates revenue while providing fair compensation to travelers.

## Fee Model

### Sender Fees (Tiered Service Fee)
Senders pay a service fee based on the weight of the package:
- **0-5kg**: $3.70
- **5.01-9.99kg**: $5.50
- **10-20kg**: $7.00

### Traveler Commission
Travelers pay **8% commission** on the base price (before service fee):
- Traveler receives: **92% of base price**
- Platform receives: **8% of base price + 100% of service fee**

### Payment Split (60/40 Model)
Traveler earnings are split into two payments:
- **60% released**: 24 hours after payment
- **40% released**: When delivery is confirmed with verification code

## Example Calculation

**Scenario**: Sender books 3kg @ $15/kg

```
Base Price:           $45.00  (3kg × $15/kg)
Service Fee:          +$3.70  (0-5kg tier)
─────────────────────────────
SENDER PAYS:          $48.70

Platform Commission:  $3.60   (8% of $45)
Service Fee Revenue:  $3.70
─────────────────────────────
PLATFORM REVENUE:     $7.30

Traveler Earnings:    $41.40  (92% of $45)
  - Initial (60%):    $24.84  (in 24h)
  - Final (40%):      $16.56  (on delivery)
```

## Implementation Details

### Frontend Components

#### 1. Fee Calculations (`src/utils/feeCalculations.js`)
- `calculateServiceFee(kg)` - Returns tiered service fee
- `calculateFeeBreakdown(kg, pricePerKg)` - Returns complete fee breakdown
- `formatCurrency(amount)` - Formats amounts for display
- `getServiceFeeDescription(kg)` - Returns fee tier description

#### 2. Payment Modal (`src/components/PaymentModal.js`)
- Shows sender fee breakdown:
  - Base price
  - Service fee
  - Total amount
- Updated to accept `pricePerKg` parameter
- Calculates and displays breakdown automatically

#### 3. Sell Kg Modal (`src/components/SellKgModal.js`)
- Shows traveler earnings breakdown:
  - Amount sender will pay
  - Base price and service fee
  - Net traveler earnings (87%)
  - Payment split (60% now, 40% on delivery)
- Auto-calculates using fee structure

### Backend Functions

#### 1. Fee Calculation Functions
```javascript
calculateServiceFee(kg)
calculateFeeBreakdown(kg, pricePerKg)
```

#### 2. Updated Cloud Functions

**`createPaymentIntent`**
- Accepts total amount (base + service fee)
- Creates Stripe payment intent

**`confirmPayment`**
- Calculates fee breakdown using pricePerKg from offer
- Updates offer earnings with traveler's net (87%)
- Stores complete fee breakdown in shipment:
  - `basePrice`
  - `serviceFee`
  - `platformCommission`
  - `travelerEarnings`
  - `initialPayment` (60%)
  - `finalPayment` (40%)
  - Payment release flags and dates

**`releaseInitialPayment`** ⭐ NEW
- Releases 60% of traveler earnings
- Requires 24 hours to have passed since payment
- Updates both shipment and delivery records
- Prevents duplicate releases

**`releaseFinalPayment`** ⭐ NEW
- Releases 40% of traveler earnings
- Requires valid verification code
- Marks shipment as "delivered"
- Updates both shipment and delivery records

### Database Schema

#### Shipment/Delivery Documents
```javascript
{
  // ... existing fields ...

  // Fee breakdown
  basePrice: 45.00,
  serviceFee: 3.70,
  platformCommission: 5.85,
  travelerEarnings: 39.15,

  // Payment splits
  initialPayment: 23.49,
  finalPayment: 15.66,
  initialPaymentReleased: false,
  finalPaymentReleased: false,
  initialPaymentDate: null,
  finalPaymentDate: null,
}
```

#### Offer Sales Array
```javascript
sales: [{
  id: "timestamp",
  kg: 3,
  amount: 48.70,  // Total sender paid
  basePrice: 45.00,
  serviceFee: 3.70,
  platformCommission: 5.85,
  travelerEarnings: 39.15,
  buyerEmail: "sender@example.com",
  buyerName: "John Doe",
  stripePaymentIntentId: "pi_xxx",
  date: Timestamp
}]
```

## Revenue Model

### Platform Revenue Streams

1. **Service Fees**:
   - 0-5kg: $3.70 per transaction
   - 5-10kg: $5.50 per transaction
   - 10-20kg: $7.00 per transaction

2. **Traveler Commission**: 13% of base price

### Monthly Revenue Projection Example

Assuming 100 transactions/month with average 4kg @ $15/kg:

```
Per Transaction:
  Base Price:           $60
  Service Fee:          $3.70
  Platform Commission:  $7.80 (13%)
  ─────────────────────────
  Platform Revenue:     $11.50

Monthly (100 transactions):
  Service Fees:         $370
  Commissions:          $780
  ─────────────────────────
  TOTAL REVENUE:        $1,150/month
```

## User Experience

### For Senders
1. Select kg amount to purchase
2. See breakdown:
   - Base price (kg × price/kg)
   - Service fee (tiered)
   - **Total to pay**
3. Pay with credit card via Stripe
4. Receive shipment tracking

### For Travelers
1. Set price per kg when creating offer
2. When creating payment request, see:
   - What sender will pay (base + fee)
   - What you'll receive (87% of base)
   - Payment split (60% now, 40% on delivery)
3. After payment:
   - 60% available after 24 hours
   - 40% released upon delivery confirmation

## Testing

### Test Scenarios

**Scenario 1: Small Package (2kg)**
- Base: 2kg × $15 = $30
- Service fee: $3.70
- Sender pays: $33.70
- Traveler earns: $27.60 (92%)
  - Initial: $16.56 (60%)
  - Final: $11.04 (40%)
- Platform revenue: $6.10

**Scenario 2: Medium Package (8kg)**
- Base: 8kg × $15 = $120
- Service fee: $5.50
- Sender pays: $125.50
- Traveler earns: $110.40 (92%)
  - Initial: $66.24 (60%)
  - Final: $44.16 (40%)
- Platform revenue: $15.10

**Scenario 3: Large Package (15kg)**
- Base: 15kg × $15 = $225
- Service fee: $7.00
- Sender pays: $232.00
- Traveler earns: $207.00 (92%)
  - Initial: $124.20 (60%)
  - Final: $82.80 (40%)
- Platform revenue: $25.00

## Deployment Status

✅ All functions deployed successfully:
- `createPaymentIntent` (updated)
- `confirmPayment` (updated with fee breakdown)
- `releaseInitialPayment` (new)
- `releaseFinalPayment` (new)

## Next Steps

### Optional Enhancements

1. **Automated Initial Payment Release**
   - Add scheduled Cloud Function to auto-release after 24h
   - Send notification to traveler

2. **Payment Dashboard**
   - Screen showing pending/released payments
   - Payment history with breakdown

3. **Analytics Dashboard**
   - Track total revenue
   - Average transaction size
   - Fee revenue vs commission revenue

4. **Dispute Resolution**
   - Handle cases where delivery fails
   - Refund policy
   - Hold/release management

## Support

For questions about the fee structure implementation, refer to:
- [feeCalculations.js](src/utils/feeCalculations.js) - Fee logic
- [functions/index.js](functions/index.js) - Backend calculations
- This document for business logic

---

**Status**: ✅ Fully Implemented and Deployed

**Last Updated**: 2026-01-15
