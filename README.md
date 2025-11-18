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

- Server: <http://localhost:3001> (Express API)
- Client: <http://localhost:5173> (Vite dev server)

The database file is automatically created at `data/snacks.db` on first run.

## Database initialization

- The backend uses SQLite and initializes the database automatically on first start.
- Default location: `data/snacks.db` at the repo root.
- The data directory is created on demand; no manual step is required.
- You can override the DB file path with the `SNACKCUPBOARD_DB_PATH` environment variable.

Examples (bash):

```bash
# Run backend and create DB automatically (default path data/snacks.db)
npm run dev:server

# Run backend on a different port (if 3001 is busy)
PORT=3002 npm run dev:server

# Use a custom DB file path
SNACKCUPBOARD_DB_PATH="/absolute/path/to/my-snacks.db" npm run dev:server
```

The database file is automatically created at `data/snacks.db` on first run.

### Production Deployment

1. Build the client:

```bash
cd client
npm run build
cd ..
```

1. Start the server:

```bash
npm start
```

The server will serve the built client from `client/dist` on <http://localhost:3001>.

## Admin Setup

### Importing Staff

Navigate to Admin Panel → Manage Staff → Import

**CSV Format**: `Initials,Surname,Forename`

Example:

```csv
Initials,Surname,Forename
JS,Smith,John
AB,Brown,Alice
CD,Davis,Carol
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
- `PUT /api/staff/:initials` — Update staff member
- `DELETE /api/staff/:initials` — Archive staff member
- `PUT /api/staff/:initials/restore` — Restore archived staff member
- `DELETE /api/staff/:initials/permanent` — Permanently delete staff member
- `POST /api/staff/bulk/archive` — Archive multiple staff members
- `POST /api/staff/bulk/restore` — Restore multiple staff members
- `POST /api/staff/bulk/delete-permanent` — Permanently delete multiple staff members

### Items

- `GET /api/items?search=` — List all items (with optional search)
- `GET /api/items/:id` — Get single item
- `POST /api/items` — Create item `{ name, price, category }`
- `POST /api/items/import-csv` — Bulk import from CSV
- `PUT /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item

### Purchases

- `POST /api/purchases` — Record purchase `{ staffInitials, items: [{ id, quantity, price }] }`
- `GET /api/purchases` — List all purchases
- `GET /api/purchases/export/csv` — Export purchases as CSV
- `GET /api/purchases/summary/by-staff` — Get spending summary by staff
- `PUT /api/purchases/:id` — Update purchase
- `DELETE /api/purchases/:id` — Delete purchase
- `POST /api/purchases/bulk/delete` — Delete multiple purchases

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

```text
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
