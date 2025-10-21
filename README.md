# Manus POS - Point of Sale System

Modern iPad-first POS system for restaurants built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Table Selection**: Choose table or take-away orders
- **Menu Management**: Browse products by category with grid/list views
- **Shopping Cart**: Add/remove items with quantity controls
- **Checkout**: Support multiple payment methods (Cash, Card, QR, Transfer)
- **Order History**: View today's orders with realtime updates
- **Multi-language**: Thai/English support via JSONB fields
- **Realtime**: Live updates for orders and inventory via Supabase Realtime

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Backend**: Supabase Edge Functions (Deno)

## Prerequisites

- Node.js 18+ 
- pnpm
- Supabase account

## Environment Variables

Create a `.env` file (or use the secrets management system):

```env
VITE_SUPABASE_URL=https://beqxldxtumyqvzjkmnpo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
client/
  src/
    pages/
      TableSelection.tsx  - Select table or take-away
      Menu.tsx           - Browse and add items to cart
      Cart.tsx           - Review cart and checkout
      Orders.tsx         - View order history
    lib/
      supabase.ts        - Supabase client setup
      store.ts           - Zustand stores (cart, app state)
      types.ts           - TypeScript types
```

## Usage Flow

1. **Select Table**: Choose a table or proceed without table (take-away)
2. **Browse Menu**: Search and filter products by category
3. **Add to Cart**: Add items with quantity controls
4. **Checkout**: Select payment method and complete order
5. **View Orders**: See order history with realtime updates

## Edge Functions

This app calls the following Edge Functions:

### POST /pos_checkout

Creates order, records payment, updates inventory atomically.

**Request:**
```json
{
  "table_id": 1,
  "items": [
    {
      "product_id": 1,
      "name": {"th": "กาแฟร้อน", "en": "Hot Coffee"},
      "qty": 2,
      "price": 45.00
    }
  ],
  "payment_method": "cash",
  "payment_amount": 100.00,
  "discount": 0,
  "tax_rate": 0.07
}
```

## Database Schema

Uses shared Supabase database with schemas:
- `pos.*` - Orders, order items, payments, tables
- `erp.*` - Products, categories, inventory
- `cms.*` - Menu overrides
- `system.*` - Audit logs

## Realtime Subscriptions

The app subscribes to:
- `pos.orders` - Order updates
- `pos.order_items` - Order item updates
- `pos.payments` - Payment updates
- `erp.products` - Product updates
- `erp.inventory_items` - Inventory updates

## Build for Production

```bash
pnpm build
```

Output will be in `client/dist/`

## Deployment

This app can be deployed to:
- Vercel (recommended)
- Netlify
- Any static hosting service

Make sure to set environment variables in your deployment platform.

## License

MIT

