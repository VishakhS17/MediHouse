import { useState, useEffect, useRef } from 'react'
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

  // Ref for form section
  const formRef = useRef<HTMLDivElement>(null)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [transactionDate, setTransactionDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [receiptNumber, setReceiptNumber] = useState('')
  const [staffName, setStaffName] = useState('')
  const [partyName, setPartyName] = useState('')
  const [billNumbers, setBillNumbers] = useState('')
  const [debitAmount, setDebitAmount] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [pendingEditTransaction, setPendingEditTransaction] = useState<CashbookTransaction | null>(null)
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null)

  // Filter state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterStaffName, setFilterStaffName] = useState('')
  const [filterPartyName, setFilterPartyName] = useState('')
  const [filterReceiptNumber, setFilterReceiptNumber] = useState('')
  const [filterTransactionType, setFilterTransactionType] = useState<'all' | 'debit' | 'credit'>('all')

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

  const resetForm = () => {
    const today = new Date()
    setTransactionDate(today.toISOString().split('T')[0])
    setReceiptNumber('')
    setStaffName('')
    setPartyName('')
    setBillNumbers('')
    setDebitAmount('')
    setCreditAmount('')
    setNotes('')
    setTransactionType('debit')
    setEditingId(null)
    setShowAddForm(false)
    setValidatedPassword(null) // Clear validated password when resetting form
  }

  const isRecordOlderThan24Hours = (createdAt: string): boolean => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 24
  }

  const handleEditStart = (transaction: CashbookTransaction) => {
    const isSuperAdmin = admin?.role?.name === 'super_admin'
    const isOlderThan24Hours = isRecordOlderThan24Hours(transaction.created_at)

    // If manager (not super admin) and record is older than 24 hours, deny edit
    if (!isSuperAdmin && isOlderThan24Hours) {
      setError('You can only edit records within 24 hours of creation. Please contact a super admin for older records.')
      return
    }

    // If super admin and record is older than 24 hours, require password
    if (isSuperAdmin && isOlderThan24Hours) {
      setPendingEditTransaction(transaction)
      setShowPasswordModal(true)
      setPasswordInput('')
      return
    }

    // Otherwise, proceed with edit
    proceedWithEdit(transaction)
  }

  const proceedWithEdit = (transaction: CashbookTransaction) => {
    setEditingId(transaction.id)
    setTransactionDate(transaction.transaction_date)
    setReceiptNumber(transaction.receipt_number)
    setStaffName(transaction.staff_name)
    setPartyName(transaction.party_name || '')
    setBillNumbers(transaction.bill_numbers || '')
    setDebitAmount(transaction.debit_amount > 0 ? transaction.debit_amount.toString() : '')
    setCreditAmount(transaction.credit_amount > 0 ? transaction.credit_amount.toString() : '')
    setTransactionType(transaction.debit_amount > 0 ? 'debit' : 'credit')
    setNotes(transaction.notes || '')
    setShowAddForm(true)
    
    // Scroll to form after state updates
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handlePasswordSubmit = () => {
    const correctPassword = 'MediHouse@170303'
    if (passwordInput === correctPassword) {
      setValidatedPassword(passwordInput) // Store validated password temporarily
      setShowPasswordModal(false)
      setPasswordInput('')
      if (pendingEditTransaction) {
        proceedWithEdit(pendingEditTransaction)
        setPendingEditTransaction(null)
      }
    } else {
      setError('Incorrect password. Please try again.')
      setPasswordInput('')
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPasswordInput('')
    setPendingEditTransaction(null)
    setValidatedPassword(null)
  }

  const handleEditCancel = () => {
    resetForm()
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

    // If editing, check if we need password (should already be validated, but double-check)
    if (editingId) {
      const transaction = transactions.find(t => t.id === editingId)
      if (transaction) {
        const isSuperAdmin = admin?.role?.name === 'super_admin'
        const isOlderThan24Hours = isRecordOlderThan24Hours(transaction.created_at)
        
        if (!isSuperAdmin && isOlderThan24Hours) {
          setError('You can only edit records within 24 hours of creation.')
          return
        }

        // If super admin editing old record, ensure password is provided
        if (isSuperAdmin && isOlderThan24Hours && !validatedPassword) {
          setError('Password validation required. Please try editing again.')
          return
        }
      }
    }

    setSubmitting(true)

    try {
      const url = editingId ? `/api/admin/cashbook?id=${editingId}` : '/api/admin/cashbook'
      const method = editingId ? 'PUT' : 'POST'

      const requestBody: any = {
        transactionDate,
        receiptNumber: receiptNumber || null,
        staffName,
        partyName: partyName || null,
        billNumbers: billNumbers || null,
        debitAmount: debit,
        creditAmount: credit,
        notes: notes || null,
      }

      // Include password if editing old record
      if (editingId && validatedPassword) {
        requestBody.password = validatedPassword
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingId ? 'Transaction updated successfully!' : 'Transaction recorded successfully!')
        resetForm()
        loadTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || (editingId ? 'Failed to update transaction' : 'Failed to record transaction'))
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
              onClick={() => {
                if (showAddForm && !editingId) {
                  resetForm()
                } else if (!showAddForm) {
                  // Reset form before opening for new transaction
                  resetForm()
                  setShowAddForm(true)
                }
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 min-h-[44px] touch-manipulation"
            >
              {showAddForm && !editingId ? 'Cancel' : '+ Add Transaction'}
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

          {/* Password Modal for Super Admin Editing Old Records */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Password Required</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This record is older than 24 hours. Please enter the password to edit it.
                </p>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit()
                    }
                  }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent mb-4"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handlePasswordCancel}
                    className="px-4 py-2 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={!passwordInput}
                    className="px-4 py-2 text-base font-semibold text-white bg-gradient-to-r from-ocean-royal to-ocean-cyan rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    Submit
                  </button>
                </div>
              </div>
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
            <div ref={formRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="px-4 py-2 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Transaction Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Receipt Number (Auto-generated if empty)</label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setReceiptNumber(value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Leave empty for auto-generation"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Staff Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                        setStaffName(value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Party Name</label>
                    <input
                      type="text"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Customer/vendor name"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction Type</label>
                    <select
                      value={transactionType}
                      onChange={(e) => {
                        setTransactionType(e.target.value as 'debit' | 'credit')
                        setDebitAmount('')
                        setCreditAmount('')
                      }}
                      className={`w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent ${
                        transactionType === 'debit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}
                      disabled={submitting}
                    >
                      <option value="debit" style={{ color: '#16a34a' }}>Debit (Collection)</option>
                      <option value="credit" style={{ color: '#dc2626' }}>Credit (Deposit/Spending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bill Numbers</label>
                    <input
                      type="text"
                      value={billNumbers}
                      onChange={(e) => setBillNumbers(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Comma-separated invoice numbers"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      onWheel={(e) => {
                        e.currentTarget.blur()
                      }}
                      className="w-full px-4 py-3 text-base font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="0.00"
                      required
                      disabled={submitting}
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                      rows={3}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent"
                      placeholder="Additional notes..."
                      disabled={submitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px] touch-manipulation"
                >
                  {submitting ? (editingId ? 'Updating...' : 'Recording...') : (editingId ? 'Update Transaction' : 'Record Transaction')}
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
              <div className="overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
                <table className="min-w-full divide-y divide-gray-200" style={{ width: '100%', tableLayout: 'auto' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt #</th>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Party</th>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Bill #</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-2 sm:px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-2 sm:px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                      <th className="px-2 sm:px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ minWidth: '90px', width: '90px', maxWidth: '90px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-semibold">{formatDate(transaction.transaction_date)}</td>
                        <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">{transaction.receipt_number}</td>
                        <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-gray-600 font-semibold">
                          <div className="truncate max-w-[80px] sm:max-w-[100px]">{transaction.staff_name}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-gray-600 font-semibold hidden sm:table-cell">
                          <div className="truncate max-w-[120px] sm:max-w-[150px]">{transaction.party_name || '-'}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-xs text-gray-600 font-semibold hidden md:table-cell">
                          <div className="truncate max-w-[80px] sm:max-w-[100px]">{transaction.bill_numbers || '-'}</div>
                        </td>
                        <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-right text-green-600 font-semibold">
                          {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : '-'}
                        </td>
                        <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-right text-red-600 font-semibold">
                          {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : '-'}
                        </td>
                        <td className="px-2 sm:px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-right font-bold">
                          <span className={transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.balance)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-xs text-gray-600 font-semibold hidden lg:table-cell">
                          <div className="truncate max-w-[120px] sm:max-w-[150px]">{transaction.notes || '-'}</div>
                        </td>
                        <td className="px-1 sm:px-2 py-3 text-center" style={{ minWidth: '90px', width: '90px', maxWidth: '90px' }}>
                          <div className="flex gap-1 justify-center items-center">
                            <button
                              onClick={() => handleEditStart(transaction)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold whitespace-nowrap"
                              title="Edit transaction"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300 text-xs">|</span>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-semibold whitespace-nowrap"
                              title="Delete transaction"
                            >
                              Delete
                            </button>
                          </div>
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

