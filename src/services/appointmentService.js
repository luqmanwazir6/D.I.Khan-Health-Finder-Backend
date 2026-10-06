import { Appointment } from '../models/Appointment.js';
import { APPOINTMENT_STATUS } from '../config/constants.js';

/**
 * Converts "HH:mm" time string to minutes from midnight.
 */
export function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:mm" time string.
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Computes end time string by adding duration minutes to start time string.
 */
export function computeEndTime(startTime, durationMinutes) {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;
  return minutesToTime(endMins);
}

/**
 * Returns lowercase weekday string ('monday'..'sunday') for a YYYY-MM-DD date string.
 */
export function getWeekdayFromDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Construct date at midday UTC to avoid local timezone date drift
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dateObj.getUTCDay()];
}

/**
 * Checks whether a given date string is before today's date (YYYY-MM-DD).
 */
export function isDateInPast(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

/**
 * Generates slot list for a doctor on a specific date, marking booked or past slots as unavailable.
 *
 * @param {object} doctor - Doctor document or plain object
 * @param {string} dateStr - Date string in "YYYY-MM-DD"
 * @returns {Promise<Array<{ startTime: string, endTime: string, isAvailable: boolean }>>}
 */
export async function generateDoctorSlots(doctor, dateStr) {
  const weekday = getWeekdayFromDate(dateStr);
  const slotDuration = doctor.slotDurationMinutes || 15;

  // 1. Find doctor's availability schedule for this weekday
  const schedule = (doctor.availability || []).find(
    (slot) => slot.day === weekday && slot.isAvailable !== false
  );

  if (!schedule) {
    return [];
  }

  const startMins = timeToMinutes(schedule.startTime);
  const endMins = timeToMinutes(schedule.endTime);

  if (startMins >= endMins) {
    return [];
  }

  // 2. Fetch existing active/pending/confirmed appointments for this doctor on this date
  const existingAppointments = await Appointment.find({
    doctor: doctor._id || doctor.id,
    date: dateStr,
    status: { $ne: APPOINTMENT_STATUS.CANCELLED }
  })
    .select('startTime')
    .lean();

  const bookedStartTimes = new Set(existingAppointments.map((a) => a.startTime));

  // Determine current time if date is today
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 3. Generate slots
  const slots = [];
  let currentStart = startMins;

  while (currentStart + slotDuration <= endMins) {
    const slotStartStr = minutesToTime(currentStart);
    const slotEndStr = minutesToTime(currentStart + slotDuration);

    let isAvailable = true;

    // A: Marked booked by non-cancelled appointment
    if (bookedStartTimes.has(slotStartStr)) {
      isAvailable = false;
    }

    // B: Past time slot for today
    if (isToday && currentStart <= currentMinutes) {
      isAvailable = false;
    }

    // C: If date is strictly in the past
    if (isDateInPast(dateStr)) {
      isAvailable = false;
    }

    slots.push({
      startTime: slotStartStr,
      endTime: slotEndStr,
      isAvailable
    });

    currentStart += slotDuration;
  }

  return slots;
}

export default {
  timeToMinutes,
  minutesToTime,
  computeEndTime,
  getWeekdayFromDate,
  isDateInPast,
  generateDoctorSlots
};
