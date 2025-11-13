# 🥨 Snack Cupboard

A full-stack web application for tracking snack and drink purchases in a common room or office environment. Staff members can select items, add them to their basket, and check out with a confirmation modal. Administrators can manage staff, items, and view purchase history.

## Features

### User Portal

- **Staff Selection**: Searchable, alphabetically sorted list of staff members
- **Item Selection**: Browse and search items with category filters (Food/Drink)
- **Shopping Basket**: Add/remove items with quantity tracking and running total
- **Checkout**: Confirmation modal with purchase summary and success animation
- **Responsive Design**: Works on desktop and mobile devices

### Admin Panel (Password: `admin123`)

- **Staff Management**: Add, edit, delete staff members; bulk import from CSV
- **Items Management**: Manage inventory with pricing and categories; bulk import from CSV
- **Purchase Management**: View, edit, and delete purchase history
- **Export Purchases**: Download purchase data as CSV for billing/reconciliation

## Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (file-based, no external DB required)
- **UI**: Custom CSS with lucide-react icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd common-room-snack-cupboard
```

2. Install dependencies:

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Development

Run both server and client in development mode:

```bash
npm run dev
```

This starts:

- **Server**: <http://localhost:3001> (Express API)
- **Client**: <http://localhost:5173> (Vite dev server)
g
The database file is automatically created at `data/snacks.db` on first run.

### Production Deployment

1. Build the client:

```bash
cd client
npm run build
cd ..
```

2. Start the server:

```bash
npm start
```

The server will serve the built client from `client/dist` on <http://localhost:3001>.

## Admin Setup

### Importing Staff

Navigate to Admin Panel → Manage Staff → Import

**CSV Format**: `StaffID,Initials,Surname,Forename`

Example:

```csv
StaffID,Initials,Surname,Forename
001,JS,Smith,John
002,AB,Brown,Alice
003,CD,Davis,Carol
```

### Importing Items

Navigate to Admin Panel → Manage Items → Import

**CSV Format**: `name,price,category` (category is optional, defaults to "Food")

Example:

```csv
name,price,category
Chocolate Bar,1.25,Food
Crisps,0.85,Food
Coca Cola,1.50,Drink
Coffee,1.20,Drink
```

## API Endpoints

### Staff

- `GET /api/staff?search=` — List all staff (with optional search)
- `POST /api/staff` — Create single staff member
- `POST /api/staff/import` — Bulk import from CSV
- `PUT /api/staff/:staffId` — Update staff member
- `DELETE /api/staff/:staffId` — Delete staff member

### Items

- `GET /api/items?search=` — List all items (with optional search)
- `GET /api/items/:id` — Get single item
- `POST /api/items` — Create item `{ name, price, category }`
- `POST /api/items/import-csv` — Bulk import from CSV
- `PUT /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item

### Purchases

- `POST /api/purchases` — Record purchase `{ staffId, items: [{ id, quantity, price }] }`
- `GET /api/purchases` — List all purchases
- `GET /api/purchases/export/csv` — Export purchases as CSV
- `GET /api/purchases/summary/by-staff` — Get spending summary by staff
- `PUT /api/purchases/:id` — Update purchase
- `DELETE /api/purchases/:id` — Delete purchase

### Health

- `GET /api/health` — Health check

## Configuration

### Admin Password

Default password is `admin123`. To change it, update the password check in `client/src/App.jsx`:

```javascript
const handlePasswordSubmit = (password) => {
    if (password === 'admin123') {  // Change this
        // ...
    }
};
```

### Port Configuration

- Server port: Set `PORT` environment variable (default: 3001)
- Client dev port: Configured in `client/vite.config.js` (default: 5173)

## Troubleshooting

**Ports in use**: If ports 3001 or 5173 are occupied, either stop the conflicting processes or change the ports in the respective config files.

**Database locked**: If you see database lock errors, ensure no other processes are accessing `data/snacks.db`.

**Development 404 warnings**: The server may log 404s for `client/dist` in development mode — this is normal since Vite serves the client separately.

## Project Structure

```
common-room-snack-cupboard/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── admin/      # Admin panel components
│   │   │   └── ...
│   │   ├── App.jsx         # Main application
│   │   └── ...
│   └── package.json
├── server/                  # Express backend
│   ├── routes/             # API route handlers
│   ├── database.js         # SQLite setup
│   └── index.js            # Server entry point
├── data/                    # SQLite database (created on first run)
└── package.json            # Root package.json
```

## License

MIT
