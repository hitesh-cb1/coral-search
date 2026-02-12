import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import { hasJwtToken, clearAllTokens } from '../../lib/tokenStorage'
import { apiGet } from '../../lib/apiClient'
import { endpoints } from '../../config/endpoints'
import { OrganizationLayout } from '../../components/common/OrganizationLayout'

interface DailyUsageData {
  date: string // Display date (e.g., "Jan 26")
  fullDate: string // Full date for export (e.g., "January 26, 2025")
  spend: number
  tokens: number
  requests: number
}

interface UsageStats {
  totalSpend: number
  previousSpend: number
  totalTokens: number
  totalRequests: number
}

export function UsagePage() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  // Date range state
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) // Last day of current month
    return { start, end }
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // Usage data states
  const [dailyData, setDailyData] = useState<DailyUsageData[]>([])
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    setIsLoggedIn(hasJwtToken())
    
    const handleStorageChange = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('storage', handleStorageChange)
    
    const handleFocus = () => {
      setIsLoggedIn(hasJwtToken())
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Load usage data when date range changes
  useEffect(() => {
    if (isLoggedIn) {
      loadUsageData()
    }
  }, [dateRange, isLoggedIn])

  const loadUsageData = async () => {
    setLoading(true)
    
    try {
      // Use selected date range - convert to UTC at start/end of day
      // Get the local date components first
      const startYear = dateRange.start.getFullYear()
      const startMonth = dateRange.start.getMonth()
      const startDay = dateRange.start.getDate()
      
      const endYear = dateRange.end.getFullYear()
      const endMonth = dateRange.end.getMonth()
      const endDay = dateRange.end.getDate()
      
      // Create UTC dates for start and end of day
      const startDate = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0))
      const endDate = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999))
      
      console.log('Date range:', {
        localStart: dateRange.start.toISOString(),
        localEnd: dateRange.end.toISOString(),
        utcStart: startDate.toISOString(),
        utcEnd: endDate.toISOString(),
      })
      
      // Get usage stats and daily usage from backend
      const params = new URLSearchParams()
      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())
      
      const statsUrl = `${endpoints.usage.getStats()}?${params.toString()}`
      const dailyUrl = endpoints.usage.getDailyUsage(startDate.toISOString(), endDate.toISOString())
      
      console.log('API URLs:', { statsUrl, dailyUrl })
      
      // Fetch both stats and daily usage in parallel
      const [statsResponse, dailyResponse] = await Promise.all([
        apiGet(statsUrl),
        apiGet(dailyUrl),
      ])
      
      console.log('Usage stats API response:', statsResponse)
      console.log('Daily usage API response:', dailyResponse)
      
      // Always generate chart data structure, even if API fails
      // Use local dates for iteration (not UTC) to match user's timezone
      const localStart = new Date(dateRange.start)
      localStart.setHours(0, 0, 0, 0)
      const localEnd = new Date(dateRange.end)
      localEnd.setHours(23, 59, 59, 999)
      const daysDiff = Math.ceil((localEnd.getTime() - localStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      if (statsResponse.error) {
        console.error('Failed to load usage stats:', statsResponse.error)
        // Generate empty chart data for all days in range
        const emptyChartData: DailyUsageData[] = []
        const currentDate = new Date(localStart)
        for (let i = 0; i < daysDiff; i++) {
          const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' })
          const dayNum = currentDate.getDate()
          const fullDate = currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
          emptyChartData.push({
            date: `${monthName} ${dayNum.toString().padStart(2, '0')}`,
            fullDate: fullDate,
            spend: 0,
            tokens: 0,
            requests: 0,
          })
          currentDate.setDate(currentDate.getDate() + 1)
        }
        setDailyData(emptyChartData)
        setStats({
          totalSpend: 0,
          previousSpend: 0,
          totalTokens: 0,
          totalRequests: 0,
        })
        return
      }
      
      // Process stats data
      const backendStats = statsResponse.data?.data?.stats || statsResponse.data?.stats || statsResponse.data
      
      // Process daily usage data (handle errors gracefully)
      let dailyUsageData: Array<{ date: string; tokens: number; requests: number }> = []
      if (!dailyResponse.error && dailyResponse.data) {
        dailyUsageData = dailyResponse.data?.data?.dailyUsage || dailyResponse.data?.dailyUsage || []
      } else {
        console.warn('Failed to load daily usage, using empty array:', dailyResponse.error)
      }
      
      console.log('Parsed backend stats:', backendStats)
      console.log('Parsed daily usage:', dailyUsageData)
      
      // Create a map of date -> usage for quick lookup
      const dailyMap = new Map<string, { tokens: number; requests: number }>()
      dailyUsageData.forEach((day: { date: string; tokens: number; requests: number }) => {
        dailyMap.set(day.date, { tokens: day.tokens || 0, requests: day.requests || 0 })
      })
      
      // Generate array for all days in the date range, filling in actual data where available
      const chartData: DailyUsageData[] = []
      // Use UTC dates for matching (backend returns UTC dates), but local dates for display
      const currentUtcDate = new Date(startDate)
      const currentLocalDate = new Date(localStart)
      
      for (let i = 0; i < daysDiff; i++) {
        // Create date key in YYYY-MM-DD format using UTC (to match backend)
        const dateKey = currentUtcDate.toISOString().split('T')[0]
        
        const usage = dailyMap.get(dateKey) || { tokens: 0, requests: 0 }
        
        // Format date for display using local date (e.g., "Jan 15")
        const monthName = currentLocalDate.toLocaleDateString('en-US', { month: 'short' })
        const dayNum = currentLocalDate.getDate()
        
        // Format full date for export (e.g., "January 15, 2025")
        const fullDate = currentLocalDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        
        chartData.push({
          date: `${monthName} ${dayNum.toString().padStart(2, '0')}`,
          fullDate: fullDate,
          spend: 0, // No spend tracking yet
          tokens: usage.tokens,
          requests: usage.requests,
        })
        
        // Move to next day (both UTC and local)
        currentUtcDate.setUTCDate(currentUtcDate.getUTCDate() + 1)
        currentLocalDate.setDate(currentLocalDate.getDate() + 1)
      }
      
      console.log('Chart data generated:', chartData.slice(0, 5), '... (showing first 5)')
      console.log('Daily map keys:', Array.from(dailyMap.keys()))
      console.log('Total chart data points:', chartData.length)
      
      setDailyData(chartData)
        
        setStats({
          totalSpend: 0, // Backend doesn't track spend yet
          previousSpend: 0,
        totalTokens: backendStats?.totalTokens || 0,
        totalRequests: backendStats?.totalRequests || 0,
      })
    } catch (error) {
      console.error('Error loading usage data:', error)
      // Generate empty chart data for all days even on error
      const localStart = new Date(dateRange.start)
      localStart.setHours(0, 0, 0, 0)
      const localEnd = new Date(dateRange.end)
      localEnd.setHours(23, 59, 59, 999)
      const daysDiff = Math.ceil((localEnd.getTime() - localStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const emptyChartData: DailyUsageData[] = []
      const currentDate = new Date(localStart)
      for (let i = 0; i < daysDiff; i++) {
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' })
        const dayNum = currentDate.getDate()
        const fullDate = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        emptyChartData.push({
          date: `${monthName} ${dayNum.toString().padStart(2, '0')}`,
          fullDate: fullDate,
          spend: 0,
          tokens: 0,
          requests: 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
      setDailyData(emptyChartData)
      setStats({
        totalSpend: 0,
        previousSpend: 0,
        totalTokens: 0,
        totalRequests: 0,
      })
    } finally {
      setLoading(false)
    }
  }


  const fetchUserProfile = async () => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const response = await apiGet(endpoints.user.profile())
      if (response.error) {
        setProfileError(response.error || 'Failed to fetch profile')
        setProfileData(null)
      } else {
        const data = response.data?.data?.user || response.data?.user || response.data?.data || response.data
        setProfileData(data)
        setShowProfileModal(true)
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to fetch profile')
      setProfileData(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileClick = () => {
    if (showProfileModal) {
      setShowProfileModal(false)
    } else {
      if (!profileData && !profileLoading) {
        fetchUserProfile()
      } else {
        setShowProfileModal(true)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileModal) {
        const target = event.target as HTMLElement
        if (!target.closest('.profile-dropdown-container')) {
          setShowProfileModal(false)
        }
      }
      // Close date picker when clicking outside
      if (showDatePicker) {
        const target = event.target as HTMLElement
        if (!target.closest('.date-picker-container')) {
          setShowDatePicker(false)
        }
      }
      // Close export menu when clicking outside
      if (showExportMenu) {
        const target = event.target as HTMLElement
        if (!target.closest('.export-menu-container')) {
          setShowExportMenu(false)
        }
      }
    }

    if (showProfileModal || showDatePicker || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileModal, showDatePicker, showExportMenu])

  const handleLogout = () => {
    clearAllTokens()
    setIsLoggedIn(false)
    navigate('/')
    setShowProfileModal(false)
  }

  // Quick date range handlers
  const setQuickDateRange = (range: '7d' | '30d' | '90d' | 'thisMonth' | 'lastMonth' | 'monthToDate' | '3m' | '6m' | '12m') => {
    const now = new Date()
    let start: Date
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    
    switch (range) {
      case '7d':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
        break
      case '30d':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0)
        break
      case '90d':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0)
        break
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'monthToDate':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        break
      case '3m':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0)
        break
      case '6m':
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate(), 0, 0, 0, 0)
        break
      case '12m':
        start = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate(), 0, 0, 0, 0)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    }
    
    setDateRange({ start, end })
    setShowDatePicker(false)
  }

  const formatDateRange = () => {
    const startStr = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const endStr = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newStart = new Date(e.target.value)
      newStart.setHours(0, 0, 0, 0)
      setDateRange(prev => ({ ...prev, start: newStart }))
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newEnd = new Date(e.target.value)
      newEnd.setHours(23, 59, 59, 999)
      setDateRange(prev => ({ ...prev, end: newEnd }))
    }
  }

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Export functions
  const exportToCSV = () => {
    if (!dailyData.length) {
      alert('No data to export')
      return
    }

    // Prepare CSV data
    const headers = ['Date', 'Tokens Used', 'API Calls', 'Spend ($)']
    const rows = dailyData.map(day => [
      day.fullDate,
      day.tokens,
      day.requests,
      day.spend.toFixed(2),
    ])

    // Add summary row
    const summaryRow = [
      'Total',
      stats?.totalTokens || 0,
      stats?.totalRequests || 0,
      (stats?.totalSpend || 0).toFixed(2),
    ]

    // Combine headers, data, and summary
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      summaryRow.join(','),
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `usage-data-${formatDateForInput(dateRange.start)}-to-${formatDateForInput(dateRange.end)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportMenu(false)
  }

  const exportToXLSX = () => {
    if (!dailyData.length) {
      alert('No data to export')
      return
    }

    // Prepare worksheet data
    const worksheetData = [
      ['Date', 'Tokens Used', 'API Calls', 'Spend ($)'],
      ...dailyData.map(day => [
        day.fullDate,
        day.tokens,
        day.requests,
        day.spend.toFixed(2),
      ]),
      [],
      ['Total', stats?.totalTokens || 0, stats?.totalRequests || 0, (stats?.totalSpend || 0).toFixed(2)],
    ]

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Date
      { wch: 15 }, // Tokens
      { wch: 15 }, // API Calls
      { wch: 15 }, // Spend
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Usage Data')

    // Write file
    XLSX.writeFile(wb, `usage-data-${formatDateForInput(dateRange.start)}-to-${formatDateForInput(dateRange.end)}.xlsx`)
    setShowExportMenu(false)
  }

  return (
    <OrganizationLayout
      isLoggedIn={isLoggedIn}
      showProfileModal={showProfileModal}
      profileLoading={profileLoading}
      profileError={profileError}
      profileData={profileData}
      onProfileClick={handleProfileClick}
      onLogout={handleLogout}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Usage Analytics</h1>
            <p className="mt-2 text-zinc-600">Monitor your API usage, tokens, and spending patterns</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Range Picker */}
            <div className="relative date-picker-container">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="min-w-[200px] text-left">{formatDateRange()}</span>
                <svg className={`h-4 w-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 z-50 w-96 rounded-lg border border-zinc-200 bg-white shadow-xl p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">Custom Date Range</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formatDateForInput(dateRange.start)}
                          onChange={handleStartDateChange}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={formatDateForInput(dateRange.end)}
                          onChange={handleEndDateChange}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#c23d3d] focus:outline-none focus:ring-1 focus:ring-[#c23d3d]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-3">Quick Ranges</h3>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setQuickDateRange('7d')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 7 Days
                        </button>
                        <button
                          onClick={() => setQuickDateRange('30d')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 30 Days
                        </button>
                        <button
                          onClick={() => setQuickDateRange('90d')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 90 Days
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setQuickDateRange('thisMonth')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => setQuickDateRange('lastMonth')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last Month
                        </button>
                        <button
                          onClick={() => setQuickDateRange('monthToDate')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Month to Date
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setQuickDateRange('3m')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={() => setQuickDateRange('6m')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 6 Months
                        </button>
                        <button
                          onClick={() => setQuickDateRange('12m')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          Last 12 Months
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export Data Button with Dropdown */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c23d3d] to-[#e15a3a] px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
                <svg className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export Menu Dropdown */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border border-zinc-200 bg-white shadow-xl py-2">
                  <button
                    onClick={exportToCSV}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToXLSX}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                  >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
                    Export as XLSX
            </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#c23d3d] border-r-transparent"></div>
              <div className="mt-4 text-zinc-600">Loading usage data...</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
              {/* Token Usage Chart */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="mb-2 text-sm font-medium text-zinc-600">Token Usage</div>
                    <div className="text-3xl font-bold text-zinc-900">
                      {stats?.totalTokens.toLocaleString() || '0'}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      tokens used this month
                    </div>
                  </div>
                </div>

                {/* Line Chart for Tokens */}
                <div className="h-80 min-h-[320px] w-full">
                  {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={dailyData} 
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value, index) => {
                          // Show every 5th date to avoid crowding
                          if (index % 5 === 0) {
                            return value.split(' ')[1] // Just the day number
                          }
                          return ''
                        }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                          return value.toString()
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number | undefined) => [value?.toLocaleString() || '0', 'Tokens']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}
                      />
                      <Line 
                        type="monotone"
                        dataKey="tokens" 
                        stroke="#c23d3d" 
                        strokeWidth={3}
                        dot={{ fill: '#c23d3d', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#c23d3d', strokeWidth: 2, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                      No data available for this month
                    </div>
                  )}
                </div>
              </div>

              {/* API Calls Chart */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="mb-2 text-sm font-medium text-zinc-600">API Calls</div>
                    <div className="text-3xl font-bold text-zinc-900">
                      {stats?.totalRequests.toLocaleString() || '0'}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      requests this month
                    </div>
                  </div>
                </div>

                {/* Bar Chart for API Calls */}
                <div className="h-80 min-h-[320px] w-full">
                  {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={dailyData} 
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value, index) => {
                          if (index % 5 === 0) {
                            return value.split(' ')[1] // Just the day number
                          }
                          return ''
                        }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                          return value.toString()
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number | undefined) => [value?.toLocaleString() || '0', 'API Calls']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}
                      />
                      <Bar 
                        dataKey="requests" 
                        fill="#e15a3a" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                      No data available for this month
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Stats Cards */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm">
                <div className="mb-4 text-sm font-medium text-zinc-600">Quick Stats</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Avg. tokens/day</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {(() => {
                        if (!stats || !dailyData.length) return '0'
                        const daysInMonth = dailyData.length
                        // Use days in month for average, or days with data if we want to exclude zeros
                        const divisor = daysInMonth > 0 ? daysInMonth : 1
                        return Math.round(stats.totalTokens / divisor).toLocaleString()
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Avg. calls/day</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {(() => {
                        if (!stats || !dailyData.length) return '0'
                        const daysInMonth = dailyData.length
                        const divisor = daysInMonth > 0 ? daysInMonth : 1
                        return Math.round(stats.totalRequests / divisor).toLocaleString()
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Peak usage day</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {(() => {
                        if (!dailyData.length) return 'N/A'
                        const peakDay = dailyData.reduce((max, day) => 
                          (day.tokens + day.requests) > (max.tokens + max.requests) ? day : max, 
                          dailyData[0]
                        )
                        // Only show peak day if there's actual usage
                        return (peakDay.tokens > 0 || peakDay.requests > 0) ? peakDay.date : 'N/A'
                      })()}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </OrganizationLayout>
  )
}