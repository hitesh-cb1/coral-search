import nodemailer from 'nodemailer'
import { logger } from '../../shared/logger'

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// HTML Email Template Base - Optimized for email clients
const emailTemplate = (content: string) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CoralBricks</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; max-width: 600px;">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="background-color: #c23d3d; padding: 40px 40px 30px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🪸 CoralBricks
              </h1>
              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px;">
                Frontier Embedding Infrastructure
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e4e4e7; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; text-align: center;">
                This email was sent by CoralBricks
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} CoralBricks. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Try API Email Content
const tryApiEmailContent = (apiKey: string) => `
  <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: 600;">
    Your API Key is Ready! 🎉
  </h2>
  
  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
    Thank you for trying CoralBricks! Your API key has been generated and is ready to use.
  </p>
  
  <div style="background-color: #fafafa; border: 2px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
      Your API Key
    </p>
    <code style="display: block; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; font-family: 'Monaco', 'Courier New', monospace; font-size: 14px; color: #18181b; word-break: break-all;">
      ${apiKey}
    </code>
  </div>
  
  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600;">
      📊 Current Limits
    </p>
    <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px;">
      <li>Up to 5 requests per second</li>
      <li>1 million tokens per month</li>
    </ul>
  </div>
  
  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 32px 0;">
    <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
      🚀 Want Higher Rate Limits?
    </p>
    <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.5;">
      Verify your email to unlock higher rate limits (10 requests/second)!
    </p>
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <a href="${FRONTEND_URL}" style="display: inline-block; background: linear-gradient(135deg, #c23d3d 0%, #e15a3a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Get Started
        </a>
      </td>
    </tr>
  </table>
  
  <p style="margin: 32px 0 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
    Need help? Check out our <a href="${FRONTEND_URL}/docs" style="color: #c23d3d; text-decoration: none;">documentation</a> or visit our <a href="${FRONTEND_URL}" style="color: #c23d3d; text-decoration: none;">website</a>.
  </p>
`

// Verification Email Content
const verificationEmailContent = (verificationToken: string) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`

  return `
  <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: bold;">
    Verify Your Email 📧
  </h2>
  
  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
    You're one step away from unlocking the full power of CoralBricks!
  </p>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ede9fe; border-left: 4px solid #8b5cf6; border-radius: 8px; margin: 0 0 32px 0;">
    <tr>
      <td style="padding: 20px;">
        <p style="margin: 0 0 12px 0; color: #5b21b6; font-size: 15px; font-weight: bold;">
          ✨ What you'll get after verification:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #6d28d9; font-size: 14px; line-height: 1.8;">
          <li><strong>Higher rate limits</strong> (10 requests/second)</li>
          <li>Continue using your existing API key</li>
          <li>Access to your dashboard</li>
          <li>Full API documentation</li>
        </ul>
      </td>
    </tr>
  </table>
  
  <!-- Button -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 32px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background-color: #c23d3d; border-radius: 8px;">
              <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                Verify Email & Unlock Higher Limits
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px; line-height: 1.6; text-align: center;">
    Or copy and paste this link into your browser:
  </p>
  <p style="margin: 0 0 32px 0; text-align: center;">
    <a href="${verificationUrl}" style="color: #c23d3d; font-size: 13px; word-break: break-all;">
      ${verificationUrl}
    </a>
  </p>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
    <tr>
      <td style="padding: 16px;">
        <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
          <strong>⏰ This link expires in 24 hours.</strong> If you didn't request this email, you can safely ignore it.
        </p>
      </td>
    </tr>
  </table>
`
}

// Welcome Email Content
const welcomeEmailContent = (firstName: string | null | undefined, verificationToken?: string) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const verificationUrl = verificationToken ? `${FRONTEND_URL}/verify-email?token=${verificationToken}` : null

  return `
  <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: 600;">
    Welcome to CoralBricks! 🎉
  </h2>
  
  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
    ${greeting}
  </p>
  
  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
    Thank you for joining CoralBricks! We're excited to have you on board. You now have access to frontier-level embedding infrastructure optimized for real-time retrieval and performance.
  </p>
  
  ${verificationUrl ? `
  <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 12px 0; color: #5b21b6; font-size: 15px; font-weight: bold;">
      ✨ Verify Your Email to Unlock Higher Limits
    </p>
    <p style="margin: 0 0 16px 0; color: #6d28d9; font-size: 14px; line-height: 1.6;">
      After verification, you'll get:
    </p>
    <ul style="margin: 0; padding-left: 20px; color: #6d28d9; font-size: 14px; line-height: 1.8;">
      <li><strong>10 requests/second</strong> (vs 5 for unverified)</li>
      <li>Access to all premium features</li>
      <li>Full API documentation</li>
    </ul>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0 0 0;">
      <tr>
        <td align="center">
          <a href="${verificationUrl}" target="_blank" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Verify Email & Unlock Higher Limits
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 16px 0 0 0; color: #7c3aed; font-size: 12px; text-align: center;">
      Or copy this link: <a href="${verificationUrl}" style="color: #8b5cf6; word-break: break-all;">${verificationUrl}</a>
    </p>
  </div>
  ` : ''}
  
  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
    <p style="margin: 0 0 8px 0; color: #065f46; font-size: 14px; font-weight: 600;">
      🚀 What's Next?
    </p>
    <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.8;">
      <li>${verificationUrl ? 'Verify your email to unlock higher limits' : 'Create your first API key in the dashboard'}</li>
      <li>Create your first API key in the dashboard</li>
      <li>Start generating embeddings for your applications</li>
      <li>Explore our API documentation</li>
      <li>Track your usage and manage your account</li>
    </ul>
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
    <tr>
      <td align="center">
        <a href="${FRONTEND_URL}/api-keys" style="display: inline-block; background: linear-gradient(135deg, #c23d3d 0%, #e15a3a 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Go to Dashboard
        </a>
      </td>
    </tr>
  </table>
  
  <p style="margin: 32px 0 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
    Need help getting started? Check out our <a href="${FRONTEND_URL}/docs" style="color: #c23d3d; text-decoration: none;">documentation</a> or visit our <a href="${FRONTEND_URL}" style="color: #c23d3d; text-decoration: none;">website</a>.
  </p>
  
  <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
    Happy building!<br>
    The CoralBricks Team
  </p>
`
}

// Password Reset Email Content
const passwordResetEmailContent = (resetToken: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`

  return `
  <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: bold;">
    Reset Your Password 🔐
  </h2>
  
  <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
    We received a request to reset your password. Click the button below to create a new password.
  </p>
  
  <!-- Button -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 32px 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background-color: #c23d3d; border-radius: 8px;">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <p style="margin: 0 0 8px 0; color: #71717a; font-size: 14px; line-height: 1.6; text-align: center;">
    Or copy and paste this link into your browser:
  </p>
  <p style="margin: 0 0 32px 0; text-align: center;">
    <a href="${resetUrl}" style="color: #c23d3d; font-size: 13px; word-break: break-all;">
      ${resetUrl}
    </a>
  </p>
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
    <tr>
      <td style="padding: 16px;">
        <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">
          <strong>⏰ This link expires in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </td>
    </tr>
  </table>
`
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    // Check if SMTP configuration is available
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASSWORD
    const from = process.env.SMTP_FROM || 'noreply@coralbricks.ai'

    if (!host || !port || !user || !pass) {
      logger.warn('SMTP configuration not found. Email sending will be disabled.')
      return
    }

    this.config = {
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      from,
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    })

    logger.info('Email service initialized successfully')
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.transporter || !this.config) {
      logger.warn('Email service not configured. Skipping email send.')
      logger.info(`[EMAIL PREVIEW] To: ${options.to}, Subject: ${options.subject}`)
      logger.info(`[EMAIL PREVIEW] Body: ${options.text || options.html}`)
      return
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      logger.info(`Email sent successfully to ${options.to}`)
    } catch (error) {
      logger.error('Failed to send email:', error)
      throw new Error('Failed to send email')
    }
  }

  async sendTryApiEmail(email: string, apiKey: string): Promise<void> {
    const htmlContent = emailTemplate(tryApiEmailContent(apiKey))

    await this.sendEmail({
      to: email,
      subject: '🎉 Your CoralBricks API Key is Ready!',
      html: htmlContent,
      text: `Your CoralBricks API Key: ${apiKey}\n\nCurrent Limits:\n- Up to 5 requests per second\n- 1 million tokens per month\n\nVerify your email to unlock higher rate limits (10 requests/second)!\n\nVisit ${FRONTEND_URL} to get started.`,
    })
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const htmlContent = emailTemplate(verificationEmailContent(verificationToken))
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`

    await this.sendEmail({
      to: email,
      subject: '✨ Verify Your Email - Unlock Higher Limits!',
      html: htmlContent,
      text: `Verify your email to unlock higher rate limits (10 requests/second)!\n\nClick here: ${verificationUrl}\n\nThis link expires in 24 hours.`,
    })
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`
    const htmlContent = emailTemplate(passwordResetEmailContent(resetToken))

    await this.sendEmail({
      to: email,
      subject: '🔐 Reset Your Password - CoralBricks',
      html: htmlContent,
      text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
    })
  }

  async sendWelcomeEmail(email: string, firstName?: string | null, verificationToken?: string): Promise<void> {
    const htmlContent = emailTemplate(welcomeEmailContent(firstName, verificationToken))
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
    
    let textContent = `${greeting}\n\nThank you for joining CoralBricks! We're excited to have you on board.\n\n`
    
    if (verificationToken) {
      const verificationUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`
      textContent += `🔐 Verify your email to unlock higher rate limits (10 requests/second):\n${verificationUrl}\n\n`
    }
    
    textContent += `Get started:\n- Create your first API key in the dashboard\n- Start generating embeddings\n- Explore our API documentation\n\nVisit ${FRONTEND_URL}/api-keys to get started.\n\nHappy building!\nThe CoralBricks Team`

    await this.sendEmail({
      to: email,
      subject: verificationToken ? '🎉 Welcome to CoralBricks! Verify Your Email' : '🎉 Welcome to CoralBricks!',
      html: htmlContent,
      text: textContent,
    })
  }

  async sendContactFormEmail(
    name: string,
    email: string,
    company: string,
    topic: string,
    role: string,
    message: string
  ): Promise<void> {
    const fields: Array<{ label: string; value: string }> = [
      { label: 'From', value: `${name} <${email}>` },
      { label: 'Reply-To', value: email },
    ]

    if (company) {
      fields.push({ label: 'Company', value: company })
    }
    if (topic) {
      fields.push({ label: 'Topic', value: topic })
    }
    if (role) {
      fields.push({ label: 'Role', value: role })
    }

    const fieldsHtml = fields
      .map((field) => `<p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px;"><strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(field.value)}</p>`)
      .join('')

    const htmlContent = emailTemplate(`
      <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px; font-weight: 600;">
        Contact form submission
      </h2>
      ${fieldsHtml}
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 16px 0 0 0; color: #52525b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
    `)

    const fieldsText = fields.map((field) => `${field.label}: ${field.value}`).join('\n')
    const textContent = `Contact form submission\n\n${fieldsText}\n\nMessage:\n${message}`

    await this.sendEmail({
      to: 'hello@coralbricks.ai',
      subject: `Contact from ${name}${company ? ` (${company})` : ''} (CoralBricks website)`,
      html: htmlContent,
      text: textContent,
    })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Singleton instance
export const emailService = new EmailService()
