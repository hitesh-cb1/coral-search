import { Request, Response } from 'express'
import { emailService } from '../../../../shared/email/email.service'

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

    try {
      await emailService.sendContactFormEmail(
        name.trim(),
        email.trim(),
        company?.trim() || '',
        topic?.trim() || '',
        role?.trim() || '',
        message.trim()
      )
      res.json({ success: true, message: 'Thank you. We will get back to you soon.' })
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to send message. Please try again later.' })
    }
  }
}
