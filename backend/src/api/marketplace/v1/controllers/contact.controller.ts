import { Request, Response } from 'express'
import { emailService } from '../../../../shared/email/email.service'
import { getPrismaClient } from '../../../../persistence/postgres/client'

export class ContactController {
  submit = async (req: Request, res: Response): Promise<void> => {
    const { name, email, company, topic, role, message } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: 'Name is required' })
      return
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ success: false, error: 'Email is required' })
      return
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, error: 'Message is required' })
      return
    }

    const nameVal = name.trim()
    const emailVal = email.trim()
    const companyVal = company?.trim() || ''
    const topicVal = topic?.trim() || ''
    const roleVal = role?.trim() || ''
    const messageVal = message.trim()

    try {
      const prisma = getPrismaClient()
      await prisma.contactSubmission.create({
        data: {
          name: nameVal,
          email: emailVal,
          company: companyVal || undefined,
          topic: topicVal || undefined,
          role: roleVal || undefined,
          message: messageVal,
        },
      })
    } catch (dbErr) {
      console.error('Contact form: failed to save to database:', dbErr)
      res.status(500).json({ success: false, error: 'Failed to send message. Please try again later.' })
      return
    }

    try {
      await emailService.sendContactFormEmail(
        nameVal,
        emailVal,
        companyVal,
        topicVal,
        roleVal,
        messageVal
      )
      res.json({ success: true, message: 'Thank you. We will get back to you soon.' })
    } catch (err) {
      // Submission already saved; log and still return success so user sees confirmation
      console.error('Contact form: failed to send notification email:', err)
      res.json({ success: true, message: 'Thank you. We will get back to you soon.' })
    }
  }
}
