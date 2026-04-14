const { format, addMinutes, isBefore, isEqual } = require('date-fns');

function generateTimeSlots(startTime, endTime, duration, bufferAfter = 0) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let current = new Date(2000, 0, 1, startHour, startMin);
  const end = new Date(2000, 0, 1, endHour, endMin);

  while (isBefore(current, end) || isEqual(current, end)) {
    const slotEnd = addMinutes(current, duration);
    if (isBefore(slotEnd, end) || isEqual(slotEnd, end)) {
      slots.push({
        start: format(current, 'HH:mm'),
        end: format(slotEnd, 'HH:mm'),
      });
    }
    current = addMinutes(current, duration + bufferAfter);
  }

  return slots;
}

module.exports = { generateTimeSlots };