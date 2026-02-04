// 1. IMPORT BOTH TRIGGERS (This fixes your error)
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// 2. Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vintproject.tn@gmail.com",
    pass: "canb bdnf owjj qmzb",
  },
});

// 3. Trigger for NEW BOOKINGS
exports.sendBookingEmail = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const booking = snapshot.data();

  const customerMailOptions = {
    from: '"Vint Solar Services" <vintproject.tn@gmail.com>',
    to: booking.customerEmail,
    subject: "Your Booking is Confirmed! - Vint Solar",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e68123;">Hello ${booking.customerName},</h2>
        <p>Thank you for choosing <strong>Vint Solar Services</strong>. We have received your booking and our team will arrive as scheduled.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <p><strong>Service:</strong> ${booking.serviceName}</p>
          <p><strong>Date:</strong> ${booking.scheduledDate}</p>
          <p><strong>Time:</strong> ${booking.scheduledTime}</p>
        </div>
        <p>If you need to reschedule, please contact us at vintenterprises@gmail.com</p>
        <p>Best Regards,<br>Team Vint</p>
      </div>
    `,
  };

  const ownerMailOptions = {
    from: '"System Alert" <vintproject.tn@gmail.com>',
    to: ["vintenterprises@gmail.com", "vintproject.tn@gmail.com"],
    subject: `NEW ORDER: ${booking.serviceName} - ${booking.customerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #e68123; border-radius: 8px; max-width: 600px;">
        <h2 style="margin-top:0; color: #e68123;">New Work Order</h2>
        <table style="width: 100%; border-collapse: collapse; line-height: 1.8;">
          <tr><td style="width: 120px;"><strong>Customer:</strong></td><td>${booking.customerName}</td></tr>
          <tr><td><strong>Phone:</strong></td><td><a href="tel:${booking.customerPhone}">${booking.customerPhone}</a></td></tr>
          <tr><td><strong>Service:</strong></td><td>${booking.serviceName}</td></tr>
          <tr><td><strong>Date/Time:</strong></td><td>${booking.scheduledDate} @ ${booking.scheduledTime}</td></tr>
          <tr><td><strong>Amount:</strong></td><td>₹${booking.totalAmount}</td></tr>
          <tr>
            <td style="vertical-align: top;"><strong>Address:</strong></td>
            <td>
              <span style="color: #333;">${booking.address?.fullAddress || 'N/A'}</span><br>
              <i style="color: #666; font-size: 13px;">Details: ${booking.address?.details || 'N/A'}</i>
            </td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
          <a href="https://www.google.com/maps/search/?api=1&query=${booking.address?.latitude},${booking.address?.longitude}" 
             style="background-color: #34C759; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
             📍 Navigate to Location
          </a>
        </div>
      </div>
    `,
  };

  try {
    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(ownerMailOptions)
    ]);
    console.log("Success: Initial booking emails sent.");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
});

// 4. Trigger for CANCELLATIONS
exports.onBookingCancelled = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  if (beforeData.status !== "cancelled" && afterData.status === "cancelled") {
    const cancelMailOptions = {
      from: '"Vint Solar System" <vintproject.tn@gmail.com>',
      to: ["vintenterprises@gmail.com", afterData.customerEmail],
      subject: `CANCELLATION: ${afterData.serviceName} - ${afterData.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #FF3B30; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #FF3B30;">Booking Cancelled</h2>
          <p>The following service booking has been <strong>cancelled</strong>.</p>
          <hr style="border:none; border-top: 1px solid #eee;" />
          <p><strong>Customer Name:</strong> ${afterData.customerName}</p>
          <p><strong>Service:</strong> ${afterData.serviceName}</p>
          <p><strong>Date:</strong> ${afterData.scheduledDate}</p>
          <p><strong>Time:</strong> ${afterData.scheduledTime}</p>
          <br />
          <p style="color: #666; font-size: 12px;">This is an automated notification from Vint Solar Enterprises.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(cancelMailOptions);
      console.log(`Cancellation alert sent for booking: ${event.params.bookingId}`);
    } catch (error) {
      console.error("Error sending cancellation email:", error);
    }
  }
 

  return null;

});


 // 5. NEW TRIGGER FOR VISIT BOOKINGS - ADD THIS
exports.sendVisitEmail = onDocumentCreated("visits/{visitId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return null;

    const visit = snapshot.data();

    // Customer confirmation email (if email provided)
    const customerMailOptions = {
      from: '"Vint Solar Services" <vintproject.tn@gmail.com>',
      to: visit.customerEmail ,
      subject: "Your  Solar Visit is Confirmed! - Vint Solar",
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e68123;">Hello ${visit.customerName || 'Customer'},</h2>
        <p>Thank you for scheduling a <strong> Solar Site Visit</strong> with Vint Solar Services!</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <p><strong>Service:</strong>  Solar Site Inspection</p>
          <p><strong>Date:</strong> ${visit.scheduledDate}</p>
          <p><strong>Time:</strong> ${visit.scheduledTime}</p>
          <p><strong>Location:</strong> ${visit.address.fullAddress}</p>
        </div>
        <p>Our expert will visit your location for a  consultation.</p>
        <p>If you need to reschedule, reply to this email or call us.</p>
        <p>Best Regards,<br><strong>Team Vint Solar</strong></p>
      </div>
    `,
    };

    // Owner notification email
    const ownerMailOptions = {
      from: '"Vint Solar System" <vintproject.tn@gmail.com>',
      to: ["vintenterprises@gmail.com", "vintproject.tn@gmail.com"],
      subject: `🟢 NEW VISIT REQUEST: ${visit.customerName || 'N/A'} - ${visit.address?.fullAddress}`,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #e68123; border-radius: 8px; max-width: 600px;">
        <h2 style="margin-top:0; color: #e68123;">New Site Visit Request</h2>
        <table style="width: 100%; border-collapse: collapse; line-height: 1.8;">
          <tr><td style="width: 120px;"><strong>Customer:</strong></td><td>${visit.customerName || 'N/A'}</td></tr>
          <tr><td><strong>Phone:</strong></td><td><a href="tel:${visit.customerPhone}">${visit.customerPhone}</a></td></tr>
          <tr><td><strong>Date:</strong></td><td>${visit.scheduledDate}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${visit.scheduledDate}</td></tr>
          <tr><td><strong>Location:</strong></td><td>${visit.address?.fullAddress}</td></tr>
        </table>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
          <a href="tel:${visit.customerPhone}" style="background-color: #34C759; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">
            📞 Call Customer
          </a>
        </div>
      </div>
    `,
    };

    try {
      await Promise.all([
        transporter.sendMail(customerMailOptions),
        transporter.sendMail(ownerMailOptions)
      ]);
      console.log("Success: Visit booking emails sent.");
    } catch (error) {
      console.error("Error sending visit emails:", error);
    }
  });