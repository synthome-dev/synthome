# @repo/stripe

Stripe integration package for handling subscriptions, billing, and overage charges.

## Architecture

All Stripe functionality is handled by the Next.js app (`apps/app`), keeping the backend API (`apps/be`) focused on the public API.

- **API Routes**: `apps/app/app/api/stripe/*`
- **Clerk Webhook**: `apps/app/app/api/webhooks/clerk`
- **Success Page**: `apps/app/app/success`

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_live_xxx          # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret from Stripe dashboard
STRIPE_PRO_PRICE_ID=price_xxx          # Price ID for the Pro plan ($50/month)

# Optional
STRIPE_SUCCESS_URL=https://app.example.com/success  # Redirect URL after checkout
STRIPE_CANCEL_URL=https://app.example.com/billing   # Redirect URL if checkout cancelled
NEXT_PUBLIC_APP_URL=https://app.example.com         # App URL for portal return
```

## Stripe Dashboard Setup

### 1. Create a Product and Price

1. Go to Stripe Dashboard → Products
2. Create a new product called "Pro Plan"
3. Add a recurring price: $50/month
4. Copy the Price ID (starts with `price_`)
5. Set `STRIPE_PRO_PRICE_ID` to this value

### 2. Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.com/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `invoice.created`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET`

### 3. Enable Customer Portal

1. Go to Stripe Dashboard → Settings → Billing → Customer portal
2. Enable the portal
3. Configure allowed actions (cancel subscription, update payment method)

### 4. Limit Subscriptions (Recommended)

1. Go to Stripe Dashboard → Settings → Billing → Subscriptions
2. Enable "Limit customers to one subscription"
3. This prevents duplicate subscriptions from race conditions

## API Endpoints

### POST /api/stripe/checkout

Creates a checkout session for upgrading to Pro plan.
Requires API key authentication.

**Response:**

```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxx"
}
```

### POST /api/stripe/portal

Creates a billing portal session for managing subscription.

**Request:**

```json
{
  "returnUrl": "/billing" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "portalUrl": "https://billing.stripe.com/..."
}
```

### POST /api/stripe/sync

Manually sync Stripe subscription data to database.

**Response:**

```json
{
  "success": true,
  "subscription": {
    "subscriptionId": "sub_xxx",
    "status": "active",
    "priceId": "price_xxx",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### GET /api/stripe/usage

Get current usage and overage status.

**Response:**

```json
{
  "success": true,
  "usage": {
    "actionsUsed": 8500,
    "monthlyLimit": 10000,
    "overageActions": 0,
    "estimatedOverageChargeCents": 0,
    "estimatedOverageChargeDollars": "0.00",
    "pendingOverageFromLastPeriodCents": 2500,
    "pendingOverageFromLastPeriodDollars": "25.00"
  }
}
```

### POST /api/stripe/webhook

Stripe webhook endpoint. Called by Stripe, not by your app.

## Billing Flow

### Free Plan

- 2,000 actions/month
- Billing period starts when organization is created
- Resets every 30 days
- No overage allowed (blocked at limit)

### Pro Plan

- $50/month base
- 10,000 actions/month included
- Overage: $5 per 1,000 additional actions (rounded up)
- Overage charged on next invoice (one month behind)

### Upgrade Flow

1. User clicks "Upgrade to Pro"
2. Frontend calls `POST /api/stripe/checkout`
3. User redirected to Stripe Checkout
4. User pays $50
5. Redirected to `/success`
6. Webhook fires, syncs subscription data
7. Usage resets to 0, limit set to 10,000

### Overage Flow

1. User uses 15,000 actions in month 1
2. At period end, we calculate: 5,000 overage = $25
3. $25 stored as `pendingOverageAmount`
4. Usage resets to 0
5. Next invoice: $50 + $25 = $75
6. Repeat

### Cancellation Flow

1. User clicks "Cancel" in Stripe Portal
2. `cancelAtPeriodEnd` set to true
3. User keeps Pro until current period ends
4. At period end, downgraded to Free plan
5. Usage resets, limit set to 2,000
