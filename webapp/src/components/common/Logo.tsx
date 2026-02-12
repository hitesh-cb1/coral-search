import { Link } from 'react-router-dom'
import { LOGO_ICON_PATH, LOGO_WITH_TEXT_PATH, USE_LOGO_WITH_TEXT, SHOW_LOGO_TEXT } from '../../config/logo.config'

interface LogoProps {
  className?: string
  showText?: boolean
  useLogoWithText?: boolean
  logoImagePath?: string
}

export function Logo({ className = '', showText, useLogoWithText, logoImagePath }: LogoProps) {
  // Determine which logo to use
  const useWithText = useLogoWithText ?? USE_LOGO_WITH_TEXT
  const finalShowText = showText ?? SHOW_LOGO_TEXT
  
  // If a custom logo path is provided, use it directly
  if (logoImagePath) {
    return (
      <Link to="/" className={`flex items-center gap-3 ${className}`}>
        <img 
          src={logoImagePath} 
          alt="CoralBricks Logo" 
          className="h-8 w-auto"
        />
        {finalShowText && !useWithText && (
          <div className="text-xl font-bold bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent leading-none">
            CoralBricks
          </div>
        )}
      </Link>
    )
  }

  // Use logo with text if configured and available
  if (useWithText && LOGO_WITH_TEXT_PATH) {
    return (
      <Link to="/" className={`flex items-center gap-3 ${className}`}>
        <img 
          src={LOGO_WITH_TEXT_PATH} 
          alt="CoralBricks Logo" 
          className="h-8 w-auto"
        />
      </Link>
    )
  }

  // Use icon-only logo with optional text
  if (LOGO_ICON_PATH) {
    return (
      <Link to="/" className={`flex items-center gap-3 ${className}`}>
        <img 
          src={LOGO_ICON_PATH} 
          alt="CoralBricks Logo" 
          className="h-8 w-auto"
        />
        {finalShowText && (
          <div className="text-xl font-bold bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent leading-none">
            CoralBricks
          </div>
        )}
      </Link>
    )
  }

  // Default logo (current inline SVG) - fallback if no images are provided
  return (
    <Link to="/" className={`flex items-center gap-3 ${className}`}>
      <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] flex items-center justify-center">
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      {finalShowText && (
        <div className="text-xl font-bold bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] bg-clip-text text-transparent leading-none">
          CoralBricks
        </div>
      )}
    </Link>
  )
}

