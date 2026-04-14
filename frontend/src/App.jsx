import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import EventTypesPage from './pages/EventTypesPage';
import BookingsPage from './pages/BookingsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import PublicBookingPage from './pages/PublicBookingPage';

function App() {
  return (
    <Routes>
      {/* Public booking page - no sidebar */}
      <Route path="/:username/:slug" element={<PublicBookingPage />} />

      {/* Admin pages - with sidebar layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<EventTypesPage />} />
        <Route path="event-types" element={<EventTypesPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
      </Route>
    </Routes>
  );
}

export default App;