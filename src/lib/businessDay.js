/**
 * businessDay.js
 * Shared helper for computing the "business day" boundary.
 * HumTum operates past midnight, so we define a new day as starting at 10 AM.
 * Orders before 10 AM belong to the previous calendar day's business.
 */

/**
 * Returns the start of the current business day (10 AM boundary).
 * If the current time is before 10 AM, it returns yesterday's 10 AM.
 *
 * @returns {Date} Start of current business day
 */
function getBusinessDayBoundary() {
  const now = new Date();
  const boundary = new Date(now);
  boundary.setHours(10, 0, 0, 0);
  if (now.getHours() < 10) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary;
}

/**
 * Returns { start, end } for the current business day.
 * start = 10 AM today (or yesterday if before 10 AM now)
 * end   = 10 AM tomorrow (i.e., 24 hours after start)
 *
 * @returns {{ start: Date, end: Date }}
 */
function getBusinessDayBounds() {
  const start = getBusinessDayBoundary();
  const end   = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

module.exports = { getBusinessDayBoundary, getBusinessDayBounds };
