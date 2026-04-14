# 📅 Scheduling Platform (Cal.com Clone)

A full-stack scheduling/booking web application that closely replicates Cal.com's design and user experience. Users can create event types, set their availability, and let others book time slots through a public booking page.

![Status](https://img.shields.io/badge/Status-Complete-green)
![React](https://img.shields.io/badge/Frontend-React.js-blue)
![Node](https://img.shields.io/badge/Backend-Node.js-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)

## 🖥️ Live Demo

- **App**: [your-deployed-url]
- **API**: [your-api-url]

## 🚀 Tech Stack

| Layer       | Technology                      |
|-------------|---------------------------------|
| Frontend    | React.js + Vite + Tailwind CSS  |
| Backend     | Node.js + Express.js            |
| Database    | PostgreSQL                      |
| HTTP Client | Axios                           |
| Icons       | Lucide React                    |
| Date Utils  | date-fns + date-fns-tz          |
| Deployment  | Vercel (FE) + Render (BE) + Neon (DB) |

## 📋 Features

### Core Features
- ✅ **Event Types Management** — Create, edit, delete, and toggle event types with title, description, duration, URL slug, location, and color
- ✅ **Availability Settings** — Set available days of the week, time ranges for each day, and timezone selection
- ✅ **Public Booking Page** — Calendar view to select date, available time slots display, booking form with name and email, and confirmation page
- ✅ **Bookings Dashboard** — View upcoming, past, and cancelled bookings with cancel functionality
- ✅ **Double Booking Prevention** — Automatic conflict detection when booking time slots

### Bonus Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Date overrides (block specific dates or set custom hours)
- ✅ Buffer time between meetings (before and after)
- ✅ Booking cancellation with reason
- ✅ Real-time slot availability (booked slots removed)
- ✅ Auto-generated URL slugs from event title
- ✅ Loading skeletons and empty states
- ✅ Cal.com-matching UI/UX design with dark sidebar

## 🗄️ Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| users | Default logged-in user (no auth) |
| event_types | Meeting types with duration, location, color |
| availability_schedules | Named schedules with timezone |
| availability_slots | Time ranges for each day of the week |
| date_overrides | Exceptions for specific dates |
| bookings | Actual booked meetings with status tracking |

### Key Design Decisions
- UUIDs as primary keys for all tables
- Cascading deletes — deleting a user removes all related data
- Check constraints — ensures valid day_of_week (0-6), end_time greater than start_time
- Unique constraints — prevents duplicate slugs per user, duplicate date overrides
- Indexes on frequently queried columns (user_id, slug, start_time, status)
- Timezone-aware timestamps — all times stored as TIMESTAMP WITH TIME ZONE

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm

### 1. Clone the repository

    git clone https://github.com/YOUR_USERNAME/scheduling-platform.git
    cd scheduling-platform

### 2. Backend Setup

    cd backend
    npm install

Create a .env file in the backend folder with these values:

    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/scheduling_platform
    PORT=5000
    DEFAULT_USER_ID=550e8400-e29b-41d4-a716-446655440000
    FRONTEND_URL=http://localhost:5173

Setup and seed the database:

    npm run db:setup
    npm run db:seed
    npm run dev

### 3. Frontend Setup

    cd frontend
    npm install
    npm run dev

### 4. Open in browser

    Frontend:  http://localhost:5173
    Backend:   http://localhost:5000
    Health:    http://localhost:5000/api/health

## 📁 Project Structure

    scheduling-platform/
    ├── backend/
    │   ├── .env.example
    │   ├── package.json
    │   └── src/
    │       ├── index.js
    │       ├── db/
    │       │   ├── connection.js
    │       │   ├── schema.sql
    │       │   ├── setup.js
    │       │   └── seed.js
    │       ├── routes/
    │       │   ├── eventTypes.js
    │       │   ├── availability.js
    │       │   ├── bookings.js
    │       │   └── public.js
    │       ├── middleware/
    │       │   └── errorHandler.js
    │       └── utils/
    │           └── timeSlots.js
    ├── frontend/
    │   ├── index.html
    │   ├── vite.config.js
    │   ├── package.json
    │   └── src/
    │       ├── main.jsx
    │       ├── App.jsx
    │       ├── index.css
    │       ├── api/
    │       │   └── index.js
    │       ├── components/
    │       │   ├── Layout/
    │       │   │   ├── Sidebar.jsx
    │       │   │   └── Layout.jsx
    │       │   ├── EventTypes/
    │       │   │   ├── EventTypeCard.jsx
    │       │   │   └── EventTypeForm.jsx
    │       │   └── UI/
    │       │       ├── Button.jsx
    │       │       ├── Input.jsx
    │       │       ├── Modal.jsx
    │       │       ├── Select.jsx
    │       │       ├── Badge.jsx
    │       │       └── Toggle.jsx
    │       └── pages/
    │           ├── EventTypesPage.jsx
    │           ├── AvailabilityPage.jsx
    │           ├── BookingsPage.jsx
    │           └── PublicBookingPage.jsx
    └── README.md

## 🔌 API Endpoints

### Event Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/event-types | List all event types |
| GET | /api/event-types/:id | Get single event type |
| POST | /api/event-types | Create event type |
| PUT | /api/event-types/:id | Update event type |
| PATCH | /api/event-types/:id/toggle | Toggle active/inactive |
| DELETE | /api/event-types/:id | Delete event type |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/availability | Get all schedules |
| GET | /api/availability/:id | Get single schedule |
| POST | /api/availability | Create schedule |
| PUT | /api/availability/:id | Update schedule |
| POST | /api/availability/:id/overrides | Add date override |
| DELETE | /api/availability/:id/overrides/:overrideId | Delete override |

### Bookings (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bookings?status=upcoming | List bookings |
| GET | /api/bookings/:id | Get single booking |
| PATCH | /api/bookings/:id/cancel | Cancel booking |
| PATCH | /api/bookings/:id/reschedule | Reschedule booking |

### Public Booking (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/public/:username/:slug | Get event info |
| GET | /api/public/:username/:slug/slots?date=YYYY-MM-DD | Get available slots |
| POST | /api/public/:username/:slug/book | Create booking |

## 🧪 Sample Data

The database is seeded with:

| Data | Details |
|------|---------|
| User | John Doe (johndoe) — default logged-in user |
| Event Types | 15 Min Meeting, 30 Min Meeting, 60 Min Consultation |
| Availability | Monday to Friday, 9:00 AM to 5:00 PM Eastern |
| Bookings | 4 upcoming, 1 past (completed), 1 cancelled |

## 🧪 Assumptions

1. No Authentication — A default user (John Doe) is assumed to be logged in for the admin side
2. Single User — The application supports one user with a default UUID
3. Timezone — Default timezone is America/New_York (Eastern Time)
4. Booking Notice — Minimum 60 minutes notice before a booking can be made
5. Booking Window — Bookings can be made up to 60 days in advance
6. Time Slots — Generated based on event duration
7. Conflict Detection — Uses PostgreSQL OVERLAPS operator for double-booking prevention

## 🛠️ Key Implementation Details

### Time Slot Generation
- Slots are generated from availability settings for the selected day
- Already booked slots are filtered out in real-time
- Past time slots are removed if the selected date is today
- Buffer time (before/after) is respected when generating slots

### Double Booking Prevention
- Backend checks for overlapping bookings using PostgreSQL OVERLAPS operator
- If a conflict is detected, the booking request is rejected with a 409 status

### Database Connection
- Uses pg library with connection pooling for efficient database access
- Raw SQL queries (no ORM) to demonstrate SQL knowledge

## 👤 Author

Your Name — your-email@example.com

## 📄 License

This project is for educational/assignment purposes.