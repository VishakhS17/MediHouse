import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

export default function UploadStock() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const ext = selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!ext || !['xls', 'xlsx'].includes(ext)) {
        setError('Please select an Excel file (.xls or .xlsx)')
        setFile(null)
        return
      }
      
      setFile(selectedFile)
      setError('')
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-stock', {
        method: 'POST',
        body: formData,
      })

      // Try to parse JSON response, with fallback for errors
      let data: any = null
      try {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            // If JSON parsing fails, use the text as error message
            setError(text || 'Failed to parse server response')
            return
          }
        } else {
          setError('Empty response from server')
          return
        }
      } catch (readError) {
        setError('Failed to read server response')
        return
      }

      if (response.ok) {
        setResult(data)
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setError(data?.message || data?.error || 'Upload failed')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'An error occurred while uploading the file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Upload Stock - Admin | MediHouse</title>
        <meta name="description" content="Upload stock quantities from Excel file" />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Stock</h1>
            <p className="text-gray-600 mt-1">
              Upload an Excel file to update product stock quantities
            </p>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Input */}
              <div>
                <label
                  htmlFor="file-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Excel File (.xls or .xlsx)
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <label
                    htmlFor="file-input"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Excel files only (.xls, .xlsx) - Max 10MB
                      </p>
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {file && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{file.name}</span>
                    <span className="text-gray-400">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Uploading and processing...
                  </span>
                ) : (
                  'Upload and Update Stock'
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">{result.stats.total}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Unique Products</p>
                  <p className="text-2xl font-bold text-purple-600">{result.stats.uniqueProducts || result.stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Updated</p>
                  <p className="text-2xl font-bold text-green-600">{result.stats.updated}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Not Found</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.stats.notFound}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Processing Time</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {result.timing?.formatted || 
                     (result.timing?.elapsedMs 
                       ? result.timing.elapsedMs < 1000 
                         ? `${result.timing.elapsedMs}ms` 
                         : `${result.timing.elapsedSeconds}s`
                       : 'N/A')}
                  </p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Errors/Warnings ({result.errors.length}):
                  </h3>
                  <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                    <ul className="space-y-1 text-sm text-gray-600">
                      {result.errors.map((err: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.stats.updated > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Successfully updated {result.stats.updated} product{result.stats.updated !== 1 ? 's' : ''}!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Your Excel file should have columns for <strong>Product Name</strong> and <strong>Stock Quantity</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  The system will automatically detect these columns (looks for &quot;Product&quot;, &quot;Stock&quot;, &quot;Quantity&quot; keywords)
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  <strong>Multiple rows with the same product name will be automatically summed</strong> - perfect for batch-wise stock files
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Products are matched by name (case-insensitive). If a product is not found, it will be skipped
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>
                  Maximum file size: 10MB. Supported formats: .xls, .xlsx
                </span>
              </li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

