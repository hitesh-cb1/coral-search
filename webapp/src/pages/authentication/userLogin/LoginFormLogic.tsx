import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { endpoints } from '../../../config/endpoints'
import { apiPost } from '../../../lib/apiClient'
import { storeJwtToken, getApiKey, removeApiKey } from '../../../lib/tokenStorage'

export interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
}

export interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface UseLoginFormReturn {
  // Form state
  formData: FormData
  errors: ValidationErrors
  touched: Record<keyof FormData, boolean>
  showPassword: boolean
  loginMessage: string
  registerMessage: string
  isLoading: boolean
  isSendingVerification: boolean
  isRegistrationSuccess: boolean
  passwordNotSetEmail: string | null
  verificationEmailSent: boolean

  // Actions
  setShowPassword: (show: boolean) => void
  handleFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlur: (field: keyof FormData) => void
  handleLogin: (e: React.FormEvent) => Promise<void>
  handleRegister: (e: React.FormEvent) => Promise<void>
  handleSendVerificationEmail: () => Promise<void>
  isFormValid: (mode: 'login' | 'register') => boolean
}

export function useLoginForm(guestApiKey?: string): UseLoginFormReturn {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  const [registerMessage, setRegisterMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  // isRegistrationSuccess: true means user has registered and should see login form
  // false means user is in register mode and should see register form
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false)
  // Password not set state - for users who used Try API but never verified
  const [passwordNotSetEmail, setPasswordNotSetEmail] = useState<string | null>(null)
  const [verificationEmailSent, setVerificationEmailSent] = useState(false)

  // Validation functions
  const validateFirstName = (firstName: string): string | undefined => {
    if (!firstName.trim()) {
      return 'First name is required'
    }
    if (firstName.trim().length < 2) {
      return 'First name must be at least 2 characters'
    }
    return undefined
  }

  const validateLastName = (lastName: string): string | undefined => {
    if (!lastName.trim()) {
      return 'Last name is required'
    }
    if (lastName.trim().length < 2) {
      return 'Last name must be at least 2 characters'
    }
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    const firstNameError = validateFirstName(formData.firstName)
    const lastNameError = validateLastName(formData.lastName)
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    if (firstNameError) newErrors.firstName = firstNameError
    if (lastNameError) newErrors.lastName = lastNameError
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Field change handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, firstName: value }))
    if (touched.firstName) {
      const error = validateFirstName(value)
      setErrors((prev) => ({ ...prev, firstName: error }))
    }
  }

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, lastName: value }))
    if (touched.lastName) {
      const error = validateLastName(value)
      setErrors((prev) => ({ ...prev, lastName: error }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, email: value }))
    if (touched.email) {
      const error = validateEmail(value)
      setErrors((prev) => ({ ...prev, email: error }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, password: value }))
    if (touched.password) {
      const error = validatePassword(value)
      setErrors((prev) => ({ ...prev, password: error }))
    }
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'firstName') {
      const error = validateFirstName(formData.firstName)
      setErrors((prev) => ({ ...prev, firstName: error }))
    } else if (field === 'lastName') {
      const error = validateLastName(formData.lastName)
      setErrors((prev) => ({ ...prev, lastName: error }))
    } else if (field === 'email') {
      const error = validateEmail(formData.email)
      setErrors((prev) => ({ ...prev, email: error }))
    } else if (field === 'password') {
      const error = validatePassword(formData.password)
      setErrors((prev) => ({ ...prev, password: error }))
    }
  }

  // Form submission handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ firstName: false, lastName: false, email: true, password: true })
    setLoginMessage('')
    setRegisterMessage('')

    // Only validate email and password for login
    const newErrors: ValidationErrors = {}
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    setIsLoading(true)
    setLoginMessage('')
    setPasswordNotSetEmail(null)
    setVerificationEmailSent(false)

    try {
      const response = await apiPost(endpoints.auth.login(), {
        email: formData.email.trim(),
        password: formData.password,
      })

      if (response.error) {
        // Check if this is a PASSWORD_NOT_SET error
        if (response.code === 'PASSWORD_NOT_SET' && response.email) {
          setPasswordNotSetEmail(response.email)
          setLoginMessage('')
        } else {
          setLoginMessage(response.error || 'Login failed. Please check your credentials.')
        }
        setIsLoading(false)
      } else {
        // Store JWT token from response
        // Response format: { success: true, data: { user: {...}, token: "..." } }
        const token = response.data?.token || response.data?.data?.token
        if (token) {
          storeJwtToken(token)
          // Clear guest API key when user logs in - they should use their own API keys
          removeApiKey()
        }

        // Redirect to home page immediately after successful login
        navigate('/')
      }
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : 'An error occurred during login')
      setIsLoading(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!passwordNotSetEmail) return

    setIsSendingVerification(true)
    try {
      const response = await apiPost(endpoints.marketplace.requestVerification(), {
        email: passwordNotSetEmail,
      })

      if (response.error) {
        setLoginMessage(response.error || 'Failed to send verification email')
      } else {
        setVerificationEmailSent(true)
        setLoginMessage('')
      }
    } catch (error) {
      setLoginMessage(error instanceof Error ? error.message : 'Failed to send verification email')
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ firstName: true, lastName: true, email: true, password: true })
    setLoginMessage('')
    setRegisterMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setRegisterMessage('')

    try {
      const storedApiKey = getApiKey()
      // Use passed guestApiKey if available, otherwise check storedApiKey
      const apiKeyToLink = guestApiKey || storedApiKey

      const response = await apiPost(endpoints.auth.register(), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        guestApiKey: apiKeyToLink || undefined,
      })

      if (response.error) {
        setRegisterMessage(response.error || 'Registration failed. Please try again.')
        setIsRegistrationSuccess(false)
      } else {
        // Show success message and switch to login mode
        setRegisterMessage(`Account created successfully! Welcome to CoralBricks, ${formData.firstName}. You can now sign in with your credentials.`)
        setIsRegistrationSuccess(true)
        removeApiKey()

        // Clear the password field for security
        setFormData(prev => ({ ...prev, password: '' }))

        // Don't store token or redirect immediately - let user see success message and manually log in
      }
    } catch (error) {
      setRegisterMessage(error instanceof Error ? error.message : 'An error occurred during registration')
      setIsRegistrationSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = (mode: 'login' | 'register'): boolean => {
    if (mode === 'login' || isRegistrationSuccess) {
      // In login mode, only check email and password
      return Boolean(
        !errors.email &&
        !errors.password &&
        formData.email.trim() &&
        formData.password.trim()
      )
    } else {
      // In register mode, check all fields
      return Boolean(
        !errors.firstName &&
        !errors.lastName &&
        !errors.email &&
        !errors.password &&
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        formData.email.trim() &&
        formData.password.trim()
      )
    }
  }

  return {
    formData,
    errors,
    touched,
    showPassword,
    loginMessage,
    registerMessage,
    isLoading,
    isSendingVerification,
    isRegistrationSuccess,
    passwordNotSetEmail,
    verificationEmailSent,
    setShowPassword,
    handleFirstNameChange,
    handleLastNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleLogin,
    handleRegister,
    handleSendVerificationEmail,
    isFormValid,
  }
}
