/**
 * businessDay.js
 * Shared helper for computing the "business day" boundary.
 * HumTum operates past midnight, so we define a new day as starting at 3 AM.
 * Orders before 3 AM belong to the previous calendar day's business.
 */

/**
 * Returns the start of the current business day (3 AM boundary).
 * If the current time is before 3 AM, it returns yesterday's 3 AM.
 *
 * @returns {Date} Start of current business day
 */
function getBusinessDayBoundary() {
  const now = new Date();
  const boundary = new Date(now);
  boundary.setHours(3, 0, 0, 0);
  if (now.getHours() < 3) {
    boundary.setDate(boundary.getDate() - 1);
  }
  return boundary;
}

/**
 * Returns { start, end } for the current business day.
 * start = 3 AM today (or yesterday if before 3 AM now)
 * end   = 3 AM tomorrow (i.e., 24 hours after start)
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
