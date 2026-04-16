// FILE: src/utils/email.js

const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const hostEmail = process.env.RESEND_HOST_EMAIL;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (resend) {
  console.log('✅ Resend email service ready');
} else {
  console.log('⚠️  Email service not configured: RESEND_API_KEY is missing');
}

async function sendEmail({ to, subject, html }) {
  if (!resend || !resendFrom) {
    console.log('⚠️  Skipping email send: missing RESEND_API_KEY or RESEND_FROM');
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: resendFrom,
    to,
    subject,
    html,
  });

  if (error) {
    const details = typeof error === 'string' ? error : JSON.stringify(error);
    throw new Error(`Resend API error: ${details}`);
  }

  return data?.id || null;
}

const formatDateTime = (dateStr, timezone) => {
  const date = new Date(dateStr);

  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  if (timezone) {
    dateOptions.timeZone = timezone;
    timeOptions.timeZone = timezone;
  }

  return {
    date: date.toLocaleDateString('en-US', dateOptions),
    time: date.toLocaleTimeString('en-US', timeOptions),
  };
};

const baseStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #e5e5e5; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #111111; border: 1px solid #222222; border-radius: 12px; padding: 32px; }
    .icon-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px; }
    .success { background-color: rgba(16, 185, 129, 0.2); color: #34d399; }
    .danger { background-color: rgba(239, 68, 68, 0.2); color: #f87171; }
    .warning { background-color: rgba(234, 179, 8, 0.2); color: #facc15; }
    h1 { color: #ffffff; font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 8px; }
    .subtitle { color: #898989; font-size: 13px; text-align: center; margin: 0 0 24px; }
    .details { background-color: #0a0a0a; border: 1px solid #222222; border-radius: 8px; padding: 20px; }
    .detail-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-label { color: #2ed1a3; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .detail-value { color: #ffffff; font-size: 14px; font-weight: 600; }
    .detail-sub { color: #888888; font-size: 13px; margin-top: 2px; }
    .detail-icon { color: #555555; font-size: 14px; margin-top: 2px; flex-shrink: 0; }
    .footer { text-align: center; margin-top: 24px; color: #555555; font-size: 12px; }
    .btn { display: inline-block; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; text-align: center; margin-top: 16px; }
    .btn-primary { background-color: #ffffff; color: #0a0a0a; }
    .reason { background-color: #1a1a1a; border: 1px solid #222222; border-radius: 6px; padding: 12px; margin-top: 16px; color: #898989; font-size: 13px; }
  </style>
`;

async function sendBookingConfirmation({ bookerName, bookerEmail, hostName, eventTitle, startTime, endTime, location, timezone }) {
  const start = formatDateTime(startTime, timezone);
  const end = formatDateTime(endTime, timezone);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="card">
          <div class="icon-circle success">✓</div>
          <h1>Booking Confirmed</h1>
          <p class="subtitle">Your meeting has been scheduled successfully.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-icon">👤</span>
              <div>
                <div class="detail-label">What</div>
                <div class="detail-value">${eventTitle}</div>
                <div class="detail-sub">between ${hostName} and ${bookerName}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <div>
                <div class="detail-label">When</div>
                <div class="detail-value">${start.date}</div>
                <div class="detail-sub">${start.time} - ${end.time}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <div>
                <div class="detail-label">Where</div>
                <div class="detail-value">${location}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">🌐</span>
              <div>
                <div class="detail-label">Timezone</div>
                <div class="detail-value">${timezone}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Powered by Cal.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send to booker
    const bookerEmailId = await sendEmail({
      to: bookerEmail,
      subject: `Booking Confirmed: ${eventTitle} with ${hostName}`,
      html,
    });

    // Send to host
    if (hostEmail) {
      const hostHtml = html.replace('Your meeting has been scheduled successfully.', `${bookerName} (${bookerEmail}) has booked a meeting with you.`);
      await sendEmail({
        to: hostEmail,
        subject: `New Booking: ${eventTitle} with ${bookerName}`,
        html: hostHtml,
      });
    }

    console.log(`✅ Confirmation email queued to ${bookerEmail}${bookerEmailId ? ` (id: ${bookerEmailId})` : ''}`);
  } catch (err) {
    console.error('⚠️  Failed to send confirmation email:', err.message);
  }
}

async function sendBookingCancellation({ bookerName, bookerEmail, hostName, eventTitle, startTime, endTime, location, timezone, reason }) {
  const start = formatDateTime(startTime, timezone);
  const end = formatDateTime(endTime, timezone);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="card">
          <div class="icon-circle danger">✕</div>
          <h1>Booking Cancelled</h1>
          <p class="subtitle">This meeting has been cancelled.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-icon">👤</span>
              <div>
                <div class="detail-label">What</div>
                <div class="detail-value">${eventTitle}</div>
                <div class="detail-sub">between ${hostName} and ${bookerName}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <div>
                <div class="detail-label">Was Scheduled</div>
                <div class="detail-value">${start.date}</div>
                <div class="detail-sub">${start.time} - ${end.time}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <div>
                <div class="detail-label">Where</div>
                <div class="detail-value">${location}</div>
              </div>
            </div>
          </div>
          
          ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ''}
          
          <div class="footer">
            <p>Powered by Cal.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const bookerEmailId = await sendEmail({
      to: bookerEmail,
      subject: `Booking Cancelled: ${eventTitle} with ${hostName}`,
      html,
    });

    if (hostEmail) {
      await sendEmail({
        to: hostEmail,
        subject: `Booking Cancelled: ${eventTitle} - ${bookerName}`,
        html,
      });
    }

    console.log(`✅ Cancellation email queued to ${bookerEmail}${bookerEmailId ? ` (id: ${bookerEmailId})` : ''}`);
  } catch (err) {
    console.error('⚠️  Failed to send cancellation email:', err.message);
  }
}

async function sendBookingRescheduled({ bookerName, bookerEmail, hostName, eventTitle, oldStartTime, oldEndTime, newStartTime, newEndTime, location, timezone }) {
  const oldStart = formatDateTime(oldStartTime, timezone);
  const oldEnd = formatDateTime(oldEndTime, timezone);
  const newStart = formatDateTime(newStartTime, timezone);
  const newEnd = formatDateTime(newEndTime, timezone);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="card">
          <div class="icon-circle warning">↻</div>
          <h1>Booking Rescheduled</h1>
          <p class="subtitle">Your meeting has been rescheduled to a new time.</p>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-icon">👤</span>
              <div>
                <div class="detail-label">What</div>
                <div class="detail-value">${eventTitle}</div>
                <div class="detail-sub">between ${hostName} and ${bookerName}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">❌</span>
              <div>
                <div class="detail-label">Previous Time</div>
                <div class="detail-value" style="text-decoration: line-through; color: #666666;">${oldStart.date}</div>
                <div class="detail-sub" style="text-decoration: line-through; color: #555555;">${oldStart.time} - ${oldEnd.time}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">✅</span>
              <div>
                <div class="detail-label">New Time</div>
                <div class="detail-value">${newStart.date}</div>
                <div class="detail-sub">${newStart.time} - ${newEnd.time}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <div>
                <div class="detail-label">Where</div>
                <div class="detail-value">${location}</div>
              </div>
            </div>
            
            <div class="detail-row">
              <span class="detail-icon">🌐</span>
              <div>
                <div class="detail-label">Timezone</div>
                <div class="detail-value">${timezone}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Powered by Cal.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const bookerEmailId = await sendEmail({
      to: bookerEmail,
      subject: `Booking Rescheduled: ${eventTitle} with ${hostName}`,
      html,
    });

    if (hostEmail) {
      await sendEmail({
        to: hostEmail,
        subject: `Booking Rescheduled: ${eventTitle} - ${bookerName}`,
        html,
      });
    }

    console.log(`✅ Reschedule email queued to ${bookerEmail}${bookerEmailId ? ` (id: ${bookerEmailId})` : ''}`);
  } catch (err) {
    console.error('⚠️  Failed to send reschedule email:', err.message);
  }
}

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendBookingRescheduled,
};