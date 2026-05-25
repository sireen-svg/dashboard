import { bookingClient } from './client';

// All routes are under the `/booking` prefix on the Booking service.
// See Booking_Service/routes/api.php.

// --- Resources ---
export const listResources = () => bookingClient.get('/booking/resources');
export const getResource = (id) => bookingClient.get(`/booking/resources/${id}`);
export const createResource = (data) => bookingClient.post('/booking/resources', data);
export const updateResource = (id, data) => bookingClient.patch(`/booking/resources/${id}`, data);
export const deleteResource = (id) => bookingClient.delete(`/booking/resources/${id}`);

// --- Availability & Policy ---
export const setAvailability = (id, availabilities) =>
  bookingClient.post(`/booking/resources/${id}/availability`, { availabilities });
export const setPolicy = (id, policies) =>
  bookingClient.post(`/booking/resources/${id}/policy`, { policies });

// --- Bookings (read) ---
// Backend returns 422 if no body is sent and no filter — pass at least an empty object.
export const getResourceBookings = (id, filters = {}) =>
  bookingClient.post(`/booking/resources/${id}/bookings`, filters);

// --- Slots ---
export const getSlots = (id, date) =>
  bookingClient.post(`/booking/resources/${id}/slots`, { date });

// --- Client booking actions ---
export const createBooking = (data) => bookingClient.post('/booking/create', data);
export const cancelBooking = (data) => bookingClient.post('/booking/cancel', data);
export const rescheduleBooking = (data) => bookingClient.post('/booking/reschedule', data);
