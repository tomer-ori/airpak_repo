import nodemailer from 'nodemailer'

export async function sendEmail({
  email,
  password,
  to,
  subject,
  html,
}: {
  email: string
  password: string
  to: string
  subject: string
  html: string
}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: email, pass: password },
  })

  await transporter.sendMail({ from: `"AirPak" <${email}>`, to, subject, html })
}
