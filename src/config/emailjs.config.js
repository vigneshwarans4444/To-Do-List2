// ============================================================
//  EmailJS Configuration
//  
//  Steps to set this up:
//  1. Go to https://www.emailjs.com and create a FREE account
//  2. Add a new Email Service → choose Gmail → connect your Gmail
//  3. Go to Email Templates → Create New Template
//     Use the template below (copy-paste into EmailJS):
//     -------------------------------------------------------
//     Subject:  Your FlowTodo Verification Code
//     Body:
//       Hi {{to_name}},
//
//       Your FlowTodo email verification code is:
//
//       {{otp_code}}
//
//       This code expires in 10 minutes.
//       If you didn't request this, ignore this email.
//
//       — The FlowTodo Team
//     -------------------------------------------------------
//  4. Copy your Service ID, Template ID, and Public Key below
// ============================================================

export const EMAILJS_CONFIG = {
  SERVICE_ID:  'service_pjm82xj',
  TEMPLATE_ID: 'template_hpsxht2',
  PUBLIC_KEY:  'CbGPlmpwUmt_Y598Z',
};

// Set to true once you have configured the keys above
export const EMAILJS_ENABLED = true;
