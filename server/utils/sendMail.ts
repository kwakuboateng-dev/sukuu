import 'dotenv/config';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const { email, subject, template, data } = options;

  // Path to mail template
  const templatePath = path.join(__dirname, '../mails', template);

  // Render mail with EJS
  const html: string = await ejs.renderFile(templatePath, data);

  // SMTP configuration options
  const smtpConfig = {
    // secure: false, // Set to true if you're using a secure connection (e.g., SSL/TLS)
    service: 'gmail', // Remove this if you're using your own SMTP server
    auth: {
      user: 'sukuulearning@gmail.com',
      pass: 'phqrwxpsfedhwztj',

    },
  };

  // Create a transporter with the SMTP configuration
  const transporter = nodemailer.createTransport(smtpConfig);

  // Send mail
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendMail;

