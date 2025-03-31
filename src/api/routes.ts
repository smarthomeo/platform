import express from 'express';
import { getBlockedDates, createBooking, getUserBookings, getBookingById, cancelBooking } from './bookings';
import { requireAuth } from '@/middleware/auth';

const router = express.Router();

// Stay booking routes
router.get('/stays/:stayId/blocked-dates', getBlockedDates);
router.post('/bookings', requireAuth, createBooking);
router.get('/bookings', requireAuth, getUserBookings);
router.get('/bookings/:bookingId', requireAuth, getBookingById);
router.put('/bookings/:bookingId/cancel', requireAuth, cancelBooking);

export default router; 