📅 Scheduling Platform (Cal.com Clone)

A full-stack scheduling/booking web application that closely replicates Cal.com's design and user experience. Users can create event types, set their availability, and let others book time slots through a public booking page.

Status
React
Node
PostgreSQL
🖥️ Live Demo

    App: [your-deployed-url]
    API: [your-api-url]

🚀 Tech Stack
Layer	Technology
Frontend	React.js + Vite + Tailwind CSS
Backend	Node.js + Express.js
Database	PostgreSQL
HTTP Client	Axios
Icons	Lucide React
Date Utils	date-fns + date-fns-tz
Deployment	Vercel (FE) + Render (BE) + Neon (DB)
📋 Features
Core Features

    ✅ Event Types Management — Create, edit, delete, and toggle event types with title, description, duration, URL slug, location, and color
    ✅ Availability Settings — Set available days of the week, time ranges for each day, and timezone selection
    ✅ Public Booking Page — Calendar view to select date, available time slots display, booking form with name and email, and confirmation page
    ✅ Bookings Dashboard — View upcoming, past, and cancelled bookings with cancel functionality
    ✅ Double Booking Prevention — Automatic conflict detection when booking time slots

Bonus Features

    ✅ Responsive design (mobile, tablet, desktop)
    ✅ Date overrides (block specific dates or set custom hours)
    ✅ Buffer time between meetings (before and after)
    ✅ Booking cancellation with reason
    ✅ Real-time slot availability (booked slots removed)
    ✅ Auto-generated URL slugs from event title
    ✅ Loading skeletons and empty states
    ✅ Cal.com-matching UI/UX design with dark sidebar

🗄️ Database Schema
Tables Overview
Table	Description
users	Default logged-in user (no auth)
event_types	Meeting types with duration, location, color
availability_schedules	Named schedules with timezone
availability_slots	Time ranges for each day of the week
date_overrides	Exceptions for specific dates
bookings	Actual booked meetings with status tracking
Entity Relationship

text

users (default user — no auth required)
│
├── event_types (1:N)
│   ├── title, slug, description, duration
│   ├── location, color, is_active
│   ├── buffer_before, buffer_after
│   ├── min_booking_notice, max_booking_days
│   │
│   └── bookings (1:N)
│       ├── booker_name, booker_email
│       ├── start_time, end_time
│       ├── status (confirmed/cancelled/completed/rescheduled)
│       ├── notes, cancellation_reason
│       └── meeting_url
│
└── availability_schedules (1:N)
    ├── name, timezone, is_default
    │
    ├── availability_slots (1:N)
    │   ├── day_of_week (0-6)
    │   ├── start_time, end_time
    │   └── is_enabled
    │
    └── date_overrides (1:N)
        ├── override_date
        ├── start_time, end_time
        └── is_available

Key Design Decisions

    UUIDs as primary keys for all tables (secure, no sequential guessing)
    Cascading deletes — deleting a user removes all related data
    Check constraints — ensures valid day_of_week (0-6), end_time > start_time
    Unique constraints — prevents duplicate slugs per user, duplicate date overrides
    Indexes on frequently queried columns (user_id, slug, start_time, status)
    Timezone-aware timestamps — all times stored as TIMESTAMP WITH TIME ZONE

⚙️ Setup Instructions
Prerequisites

    Node.js (v18+)
    PostgreSQL (v14+)
    npm

1. Clone the repository

text

git clone https://github.com/YOUR_USERNAME/scheduling-platform.git
cd scheduling-platform

2. Backend Setup

text

cd backend
npm install

Create a .env file in the backend folder:

text

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/scheduling_platform
PORT=5000
DEFAULT_USER_ID=550e8400-e29b-41d4-a716-446655440000
FRONTEND_URL=http://localhost:5173

Setup and seed the database:

text

npm run db:setup
npm run db:seed
npm run dev

3. Frontend Setup

text

cd frontend
npm install
npm run dev

4. Open in browser

text

Frontend:  http://localhost:5173
Backend:   http://localhost:5000
Health:    http://localhost:5000/api/health

📁 Project Structure

text

scheduling-platform/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js                  # Express server entry point
│       ├── db/
│       │   ├── connection.js         # PostgreSQL pool connection
│       │   ├── schema.sql            # Complete database schema
│       │   ├── setup.js              # Database creation script
│       │   └── seed.js               # Sample data seeder
│       ├── routes/
│       │   ├── eventTypes.js         # Event types CRUD API
│       │   ├── availability.js       # Availability management API
│       │   ├── bookings.js           # Bookings dashboard API
│       │   └── public.js             # Public booking page API
│       ├── middleware/
│       │   └── errorHandler.js       # Global error handling
│       └── utils/
│           └── timeSlots.js          # Time slot generation utility
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                  # App entry with BrowserRouter
│       ├── App.jsx                   # Route configuration
│       ├── index.css                 # Tailwind CSS + global styles
│       ├── api/
│       │   └── index.js              # Axios API service layer
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── Sidebar.jsx       # Cal.com-style dark sidebar
│       │   │   └── Layout.jsx        # Main layout wrapper
│       │   ├── EventTypes/
│       │   │   ├── EventTypeCard.jsx # Event type list item
│       │   │   └── EventTypeForm.jsx # Create/edit form
│       │   └── UI/
│       │       ├── Button.jsx        # Reusable button component
│       │       ├── Input.jsx         # Form input component
│       │       ├── Modal.jsx         # Modal dialog component
│       │       ├── Select.jsx        # Dropdown select component
│       │       ├── Badge.jsx         # Status badge component
│       │       └── Toggle.jsx        # Toggle switch component
│       └── pages/
│           ├── EventTypesPage.jsx    # Event types management
│           ├── AvailabilityPage.jsx  # Availability settings
│           ├── BookingsPage.jsx      # Bookings dashboard
│           └── PublicBookingPage.jsx # Public booking flow
│
└── README.md

🔌 API Endpoints
Event Types
Method	Endpoint	Description
GET	/api/event-types	List all event types
GET	/api/event-types/:id	Get single event type
POST	/api/event-types	Create event type
PUT	/api/event-types/:id	Update event type
PATCH	/api/event-types/:id/toggle	Toggle active/inactive
DELETE	/api/event-types/:id	Delete event type
Availability
Method	Endpoint	Description
GET	/api/availability	Get all schedules
GET	/api/availability/:id	Get single schedule
POST	/api/availability	Create schedule
PUT	/api/availability/:id	Update schedule
POST	/api/availability/:id/overrides	Add date override
DELETE	/api/availability/:id/overrides/:overrideId	Delete override
Bookings (Admin)
Method	Endpoint	Description
GET	/api/bookings?status=upcoming	List bookings
GET	/api/bookings/:id	Get single booking
PATCH	/api/bookings/:id/cancel	Cancel booking
PATCH	/api/bookings/:id/reschedule	Reschedule booking
Public Booking (No Auth)
Method	Endpoint	Description
GET	/api/public/:username/:slug	Get event info
GET	/api/public/:username/:slug/slots?date=YYYY-MM-DD	Get available slots
POST	/api/public/:username/:slug/book	Create booking
📸 Screenshots
Event Types Dashboard

Dark sidebar with Cal.com-style navigation. Event types displayed as list items with color indicators, duration, location, toggle switches, and action menus.
Availability Settings

Weekly schedule with toggle switches for each day, time range pickers, timezone selector, and date override management.
Public Booking Page

Three-step booking flow: Calendar date selection → Time slot picker → Booking form → Confirmation page.
Bookings Dashboard

Tabbed interface (Upcoming/Past/Cancelled) with bookings grouped by date, showing booker details and action buttons.
🧪 Sample Data

The database is seeded with:
Data	Details
User	John Doe (johndoe) — default logged-in user
Event Types	15 Min Meeting, 30 Min Meeting, 60 Min Consultation
Availability	Monday–Friday, 9:00 AM – 5:00 PM Eastern
Bookings	4 upcoming, 1 past (completed), 1 cancelled
🧪 Assumptions

    No Authentication — A default user (John Doe) is assumed to be logged in for the admin side
    Single User — The application supports one user with a default UUID
    Timezone — Default timezone is America/New_York (Eastern Time)
    Booking Notice — Minimum 60 minutes notice before a booking can be made
    Booking Window — Bookings can be made up to 60 days in advance
    Time Slots — Generated based on event duration (e.g., 30-min slots for a 30-min event)
    Conflict Detection — Uses PostgreSQL's OVERLAPS operator for double-booking prevention

🛠️ Key Implementation Details
Time Slot Generation

    Slots are generated from availability settings for the selected day
    Already booked slots are filtered out in real-time
    Past time slots are removed if the selected date is today
    Buffer time (before/after) is respected when generating slots

Double Booking Prevention

    Backend checks for overlapping bookings using PostgreSQL OVERLAPS operator
    If a conflict is detected, the booking request is rejected with a 409 status

Database Connection

    Uses pg library with connection pooling for efficient database access
    Raw SQL queries (no ORM) to demonstrate SQL knowledge

👤 Author

Your Name — your-email@example.com
📄 License

This project is for educational/assignment purposes.