import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

interface CashbookTransaction {
  id: number
  transaction_date: string
  receipt_number: string
  staff_name: string
  party_name: string | null
  bill_numbers: string | null
  debit_amount: number
  credit_amount: number
  balance: number
  notes: string | null
  created_at: string
  updated_at: string
  created_by_name: string | null
}

export default function Cashbook() {
  const { admin, hasPermission } = useAdminAuth()
  const [transactions, setTransactions] = useState<CashbookTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentBalance, setCurrentBalance] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalDebit, setTotalDebit] = useState(0)
  const [totalCredit, setTotalCredit] = useState(0)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [transactionDate, setTransactionDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [receiptNumber, setReceiptNumber] = useState('')
  const [staffName, setStaffName] = useState(admin?.name || '')
  const [partyName, setPartyName] = useState('')
  const [billNumbers, setBillNumbers] = useState('')
  const [debitAmount, setDebitAmount] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit')

  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterStaffName, setFilterStaffName] = useState('')
  const [filterPartyName, setFilterPartyName] = useState('')
  const [filterReceiptNumber, setFilterReceiptNumber] = useState('')
  const [filterTransactionType, setFilterTransactionType] = useState<'all' | 'debit' | 'credit'>('all')

  useEffect(() => {
    if (admin?.name) {
      setStaffName(admin.name)
    }
  }, [admin])

  useEffect(() => {
    if (admin) {
      loadTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, startDate, endDate, filterStaffName, filterPartyName, filterReceiptNumber, filterTransactionType])

  const loadTransactions = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
      })

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (filterStaffName) params.append('staffName', filterStaffName)
      if (filterPartyName) params.append('partyName', filterPartyName)
      if (filterReceiptNumber) params.append('receiptNumber', filterReceiptNumber)
      if (filterTransactionType && filterTransactionType !== 'all') params.append('transactionType', filterTransactionType)

      const response = await fetch(`/api/admin/cashbook?${params.toString()}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to load transactions')
      }

      const data = await response.json()
      setTransactions(data.data || [])
      setCurrentBalance(data.currentBalance || 0)
      setTotalRecords(data.total || 0)
      setTotalDebit(data.totalDebit || 0)
      setTotalCredit(data.totalCredit || 0)
    } catch (err: any) {
      console.error('Error loading transactions:', err)
      setError(err.message || 'An error occurred while loading transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!transactionDate || !staffName) {
      setError('Transaction date and staff name are required')
      return
    }

    const debit = transactionType === 'debit' ? parseFloat(debitAmount) : 0
    const credit = transactionType === 'credit' ? parseFloat(creditAmount) : 0

    if (debit <= 0 && credit <= 0) {
      setError('Please enter an amount')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/cashbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify({
          transactionDate,
          receiptNumber: receiptNumber || null,
          staffName,
          partyName: partyName || null,
          billNumbers: billNumbers || null,
          debitAmount: debit,
          creditAmount: credit,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Transaction recorded successfully!')
        // Reset form
        setReceiptNumber('')
        setPartyName('')
        setBillNumbers('')
        setDebitAmount('')
        setCreditAmount('')
        setNotes('')
        setTransactionType('debit')
        setShowAddForm(false)
        loadTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to record transaction')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }

    setError('')
    try {
      const response = await fetch(`/api/admin/cashbook?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        setSuccess('Transaction deleted successfully!')
        loadTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete transaction')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0)
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      // Build query string with filters
      let queryString = 'download=true'
      if (startDate) {
        queryString += `&startDate=${encodeURIComponent(startDate)}`
      }
      if (endDate) {
        queryString += `&endDate=${encodeURIComponent(endDate)}`
      }
      if (filterStaffName.trim()) {
        queryString += `&staffName=${encodeURIComponent(filterStaffName.trim())}`
      }
      if (filterPartyName.trim()) {
        queryString += `&partyName=${encodeURIComponent(filterPartyName.trim())}`
      }
      if (filterReceiptNumber.trim()) {
        queryString += `&receiptNumber=${encodeURIComponent(filterReceiptNumber.trim())}`
      }
      if (filterTransactionType && filterTransactionType !== 'all') {
        queryString += `&transactionType=${encodeURIComponent(filterTransactionType)}`
      }

      const response = await fetch(`/api/admin/cashbook?${queryString}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to download report'}`)
        setDownloading(false)
        return
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Cashbook.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error: any) {
      console.error('Download error:', error)
      alert('Error downloading report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setFilterStaffName('')
    setFilterPartyName('')
    setFilterReceiptNumber('')
    setFilterTransactionType('all')
  }

  if (!hasPermission('manage_cashbook')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | medi-house</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to access cashbook. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Cashbook - Admin | medi-house</title>
        <meta name="description" content="Manage cashbook transactions" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cashbook</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Track cash collections (debits) and deposits/spending (credits)
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 min-h-[44px] touch-manipulation"
            >
              {showAddForm ? 'Cancel' : '+ Add Transaction'}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Summary Card */}
          {!loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Balance</p>
                  <p className={`text-2xl font-bold mt-2 ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Debit Collected</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(totalDebit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credit Deposited</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(totalCredit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{totalRecords}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Transaction Form */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Add New Transaction</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Transaction Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt Number (Auto-generated if empty)</label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Leave empty for auto-generation"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Staff Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Party Name</label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Customer/vendor name"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Type</label>
                    <select
                      value={transactionType}
                      onChange={(e) => {
                        setTransactionType(e.target.value as 'debit' | 'credit')
                        setDebitAmount('')
                        setCreditAmount('')
                      }}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      disabled={submitting}
                    >
                      <option value="debit">Debit (Collection)</option>
                      <option value="credit">Credit (Deposit/Spending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={transactionType === 'debit' ? debitAmount : creditAmount}
                      onChange={(e) => {
                        if (transactionType === 'debit') {
                          setDebitAmount(e.target.value)
                        } else {
                          setCreditAmount(e.target.value)
                        }
                      }}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="0.00"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Numbers</label>
                    <input
                      type="text"
                      value={billNumbers}
                      onChange={(e) => setBillNumbers(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Comma-separated invoice numbers"
                      disabled={submitting}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Additional notes..."
                      disabled={submitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px] touch-manipulation"
                >
                  {submitting ? 'Recording...' : 'Record Transaction'}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || transactions.length === 0}
                className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                {downloading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Excel
                  </span>
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Type</label>
                <select
                  value={filterTransactionType}
                  onChange={(e) => setFilterTransactionType(e.target.value as 'all' | 'debit' | 'credit')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  <option value="debit">Debit (Collection)</option>
                  <option value="credit">Credit (Deposit/Spending)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff Name</label>
                <input
                  type="text"
                  value={filterStaffName}
                  onChange={(e) => setFilterStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                  placeholder="Filter by staff"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Party Name</label>
                <input
                  type="text"
                  value={filterPartyName}
                  onChange={(e) => setFilterPartyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                  placeholder="Filter by party"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt Number</label>
                <input
                  type="text"
                  value={filterReceiptNumber}
                  onChange={(e) => setFilterReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                  placeholder="Filter by receipt"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                disabled={!startDate && !endDate && filterTransactionType === 'all' && !filterStaffName && !filterPartyName && !filterReceiptNumber}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Transactions</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-royal mx-auto"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">No transactions found</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Party</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Bill #</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                      <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.transaction_date)}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.receipt_number}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600">{transaction.staff_name}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{transaction.party_name || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs text-gray-600 hidden md:table-cell">{transaction.bill_numbers || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-right font-semibold">
                          <span className={transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.balance)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{transaction.notes || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            title="Delete transaction"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

