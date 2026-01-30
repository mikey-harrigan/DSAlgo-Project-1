import emailjs from '@emailjs/browser';

// EmailJS Configuration - Replace these with your actual values
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const RECIPIENT_EMAIL = 'jared.bluesteen@gmail.com';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export const sendEmail = async (subject, body) => {
  try {
    const templateParams = {
      to_email: RECIPIENT_EMAIL,
      subject: subject,
      message: body
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true, message: 'TRANSMISSION COMPLETE' };
    } else {
      return { success: false, message: 'SIGNAL INTERCEPTED — RETRY' };
    }
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: 'SIGNAL INTERCEPTED — RETRY' };
  }
};

export const isEmailConfigured = () => {
  return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
         EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
         EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
};

export default { sendEmail, isEmailConfigured };
