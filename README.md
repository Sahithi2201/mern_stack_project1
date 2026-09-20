# Ticket Management System / Ticket Booking System (MERN Stack)

A complete, clean, modular, and responsive college-level web application for ticket booking and event management built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

---

## 1. Project Overview & Architecture

The Ticket Management System is structured around a decoupled **Client-Server Architecture**:

- **Frontend (Client)**: Built with React.js (pure JavaScript/JSX), React Router DOM for client-side routing, Context API for global authentication state, and Axios for centralized API calls.
- **Backend (Server)**: A RESTful API built on Node.js and Express.js, using JSON Web Tokens (JWT) for secure authentication and bcryptjs for password hashing.
- **Database (MongoDB)**: Utilizes Mongoose ODM to model three core relational-style collections: `Users`, `Events`, and `Bookings`.

### Architecture Flow:
```
[ User / Admin Browser ]
         ↕ (HTTP / JSON / JWT Header)
[ React Client (Vite: port 5173) ]
         ↕ (Axios Service Layer: /api/*)
[ Express REST API (Node.js: port 5000) ]
         ↕ (Mongoose ODM)
[ MongoDB Database (ticket_management_db) ]
```

---

## 2. Complete Folder Structure

```
ticket-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── SeatGrid.jsx
│   │   │   ├── BookingCard.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── BookingConfirmation.jsx
│   │   │   ├── BookingHistory.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageEvents.jsx
│   │   │   ├── ManageBookings.jsx
│   │   │   └── ManageUsers.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── eventService.js
│   │   │   └── bookingService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   ├── validation.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── bookingRoutes.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── seed/
│   │   └── seedData.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Database Relationships

The database is built using **Mongoose** with clear foreign-key references:

1. **User Model**:
   - `_id`: Unique identifier
   - `name`: User's full name
   - `email`: Unique email address
   - `password`: Salted and hashed password (via `bcryptjs`)
   - `role`: Role of user (`'user'` or `'admin'`)
   - `createdAt`: Timestamp

2. **Event Model**:
   - `_id`: Unique event ID
   - `name`, `description`, `category`, `location`, `date`, `time`, `price`, `image`
   - `totalSeats`: Total seat capacity
   - `availableSeats`: Dynamic count of unoccupied seats
   - `seats`: Array of subdocuments `[{ seatNumber: 'A1', status: 'AVAILABLE' | 'BOOKED' }]`

3. **Booking Model**:
   - `_id`: Unique booking reference
   - `user`: References `User._id` (Foreign key: Many Bookings to One User)
   - `event`: References `Event._id` (Foreign key: Many Bookings to One Event)
   - `selectedSeats`: Array of seat numbers (e.g. `['A1', 'A2']`)
   - `numberOfSeats`: Calculated count
   - `totalAmount`: Calculated on the backend (`numberOfSeats * event.price`)
   - `bookingDate`: Date of booking
   - `status`: `'CONFIRMED'` | `'CANCELLED'`

### Relationship Diagram:
```
+----------------+          +-------------------+          +----------------+
|      USER      | 1      * |      BOOKING      | *      1 |     EVENT      |
+----------------+----------+-------------------+----------+----------------+
| _id            |          | _id               |          | _id            |
| name           |          | user (FK -> User) |          | name           |
| email (unique) |          | event(FK -> Event)|          | location, date |
| password(hash) |          | selectedSeats []  |          | price          |
| role           |          | numberOfSeats     |          | totalSeats     |
+----------------+          | totalAmount       |          | availableSeats |
                            | status (CONFIRMED)|          | seats []       |
                            +-------------------+          +----------------+
```

---

## 4. Dependencies Installed

### Backend (`server/`):
- `express`: Fast, minimalist web framework for Node.js REST API.
- `mongoose`: Elegant MongoDB object modeling for validation and queries.
- `jsonwebtoken`: Secure token generation and verification for authentication.
- `bcryptjs`: Password hashing with salt rounds.
- `cors`: Cross-Origin Resource Sharing middleware.
- `dotenv`: Loads environment variables from `.env` file into `process.env`.

### Frontend (`client/`):
- `react` & `react-dom`: Declarative UI library.
- `react-router-dom`: Client-side routing with nested paths and navigation guards.
- `axios`: Promise-based HTTP client with request interceptors for JWT injection.
- `lucide-react`: Lightweight, clean icons for UI elements.
- `vite` & `@vitejs/plugin-react`: Ultra-fast build tool and development server.

---

## 5. Development Phases

- **Phase 1: Project folders, package.json files, .gitignore, and .env.example (COMPLETED)**
- **Phase 2:** Configure MongoDB and Mongoose (`server/config/db.js`)
- **Phase 3:** Create Mongoose Models (`User`, `Event`, `Booking`)
- **Phase 4:** Authentication APIs & JWT Middleware (`register`, `login`, `me`)
- **Phase 5:** Event CRUD APIs & Search/Filter capabilities
- **Phase 6:** Booking APIs, server-side price validation, and Seat Management
- **Phase 7:** React Router, Context API, and Protected Routes
- **Phase 8:** Event Listing, Search, Filter, and Sort UI
- **Phase 9:** Event Details & Interactive Visual Seat Grid UI
- **Phase 10:** Booking Confirmation & History with Cancellation
- **Phase 11:** Admin Dashboard & Management views
- **Phase 12:** Centralized Error Handling, Form Validations, and Styling
- **Phase 13:** Realistic Indian Event Seed Data script
- **Phase 14:** Comprehensive End-to-End System Testing & Review Checklist
