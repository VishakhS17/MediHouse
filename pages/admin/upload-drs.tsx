import { useState } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function UploadDRS() {
  const { admin } = useAdminAuth()
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

    if (!admin) {
      setError('Admin session not found. Please log in again.')
      setUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('admin', JSON.stringify(admin))

      const response = await fetch('/api/admin/upload-drs', {
        method: 'POST',
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
        body: formData,
      })

      let data: any = null
      try {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
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
        const errorMsg = data?.error || data?.message || 'Upload failed'
        const details = data?.details ? `\n\nDetails: ${data.details}` : ''
        setError(`${errorMsg}${details}`)
        console.error('Upload failed:', data)
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
        <title>Upload DRS (Outstanding Bills) - MediHouse Admin</title>
      </Head>
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload DRS (Outstanding Bills)</h1>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-semibold text-blue-900 mb-2">File Format Requirements:</h2>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>The Excel file must contain the following columns: <strong>DATE</strong>, <strong>INV NO</strong>, <strong>Customer Name</strong>, <strong>AMT</strong>, <strong>REC</strong></li>
                <li>Existing records (matching Invoice Number + Customer Name) will be updated</li>
                <li>New records will be inserted automatically</li>
                <li>Pending Balance and Credit Days are calculated automatically</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Select DRS Excel File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploading}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Upload Successful!</h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Total rows processed:</strong> {result.stats?.total || 0}</p>
                    <p><strong>New records inserted:</strong> {result.stats?.inserted || 0}</p>
                    <p><strong>Existing records updated:</strong> {result.stats?.updated || 0}</p>
                    {result.stats?.rowsWithRef !== undefined && (
                      <p>
                        <strong>Rows with REF values:</strong> {result.stats.rowsWithRef} 
                        {result.stats.distinctRefs > 0 && (
                          <span> ({result.stats.distinctRefs} distinct REF values)</span>
                        )}
                      </p>
                    )}
                    {result.stats?.sampleRefs && result.stats.sampleRefs.length > 0 && (
                      <p className="text-xs text-gray-600">
                        <strong>Sample REFs:</strong> {result.stats.sampleRefs.join(', ')}
                      </p>
                    )}
                    {result.stats?.errors > 0 && (
                      <p className="text-red-600"><strong>Errors:</strong> {result.stats.errors}</p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Error Details:</p>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          {result.errors.map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload DRS File'}
              </button>
            </form>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

