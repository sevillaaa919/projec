# Barangay Resident and Request System

Front end: HTML, CSS, JavaScript (in `frontend/`). Back end: Node.js + Express. Database: MongoDB Atlas (Mongoose).

## Run
1. Create a `.env` file in the project root (next to `backend/` and `frontend/`):
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=3000
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_admin_password
   SESSION_SECRET=any_long_random_text
   ```
2. `cd backend`
3. `npm install`
4. `npm start` (or `npm run dev`)
5. Open http://localhost:3000

## Folder structure
- `backend/` - `server.js` (Express server, Mongoose models, routes), `package.json`
- `frontend/` - `index.html` (page shell), `script.js` (shared helpers, menu, page switching), `style.css`
- `frontend/components/` - one file per page: `login`, `dashboard`, `residents`, `requests`, `certificate`

## Routes
GET/POST `/residents`, GET/PUT/DELETE `/residents/:id`, GET/POST `/requests`, GET/PUT `/requests/:id`, GET `/stats`

## Admin login
The first time the server starts with an empty database it creates the admin from `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` (password is stored hashed). After that, anyone using the same database logs in with that account. All data routes return 401 until logged in.
