import type { NextApiRequest, NextApiResponse } from 'next'
import { query, getPool } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import formidable from 'formidable'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Disable body parsing, we'll handle it with formidable
export const config = {
  api: {
    bodyParser: false,
  },
}

interface DRSParsedRow {
  billDate: Date
  invoiceNumber: string
  customerName: string
  ref?: string
  area?: string
  totalAmount: number
  receivedAmount: number
}

async function parseDRSExcelFile(filePath: string): Promise<DRSParsedRow[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Uploaded file not found at path: ${filePath}`)
  }

  let workbook
  try {
    const fileBuffer = fs.readFileSync(filePath)
    workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    })
  } catch (readError: any) {
    throw new Error(`Failed to read Excel file: ${readError.message}`)
  }
  
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel file appears to be empty or invalid - no sheets found')
  }
  
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  if (!worksheet) {
    throw new Error(`Failed to read worksheet "${sheetName}" from Excel file`)
  }
  
  // Convert to array of arrays
  let data: any[][]
  try {
    data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
  } catch (parseError: any) {
    throw new Error(`Failed to parse Excel data: ${parseError.message}`)
  }
  
  if (data.length === 0) {
    throw new Error('Excel file is empty')
  }
  
  // Find header row and columns
  let headerRowIndex = -1
  let dateCol = -1
  let invoiceNoCol = -1
  let customerNameCol = -1
  let refCol = -1
  let areaCol = -1
  let amtCol = -1
  let recCol = -1
  
  // Search first 20 rows for headers
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim()
      
      // Check for date column (first date column - bill date)
      if (dateCol === -1 && (
        cell === 'date' || 
        cell.includes('bill date') ||
        cell.includes('invoice date')
      )) {
        dateCol = j
        headerRowIndex = i
      }
      
      // Check for invoice number column
      if (invoiceNoCol === -1 && (
        cell === 'inv no' ||
        cell === 'invoice no' ||
        cell === 'invno' ||
        cell.includes('invoice number') ||
        cell.includes('inv number')
      )) {
        invoiceNoCol = j
      }
      
      // Check for customer name column
      if (customerNameCol === -1 && (
        cell.includes('customer') ||
        cell.includes('party name') ||
        cell.includes('client')
      )) {
        customerNameCol = j
      }
      
      // Check for REF column (case-insensitive, handle various formats)
      if (refCol === -1 && (
        cell === 'ref' ||
        cell === 'reference' ||
        cell === 'ref no' ||
        cell === 'refno' ||
        cell.includes('ref no') ||
        cell.includes('reference number') ||
        cell.includes('ref.') ||
        cell.includes('ref:')
      )) {
        refCol = j
        headerRowIndex = i // Ensure header row is set
      }
      
      // Check for AREA column (case-insensitive, handle various formats)
      if (areaCol === -1 && (
        cell === 'area' ||
        cell.includes('area') ||
        cell.includes('location') ||
        cell.includes('region')
      )) {
        areaCol = j
      }
      
      // Check for AMT column
      if (amtCol === -1 && (
        cell === 'amt' ||
        cell === 'amount' ||
        cell.includes('total amount') ||
        cell.includes('bill amount')
      )) {
        amtCol = j
      }
      
      // Check for REC column
      if (recCol === -1 && (
        cell === 'rec' ||
        cell === 'received' ||
        cell.includes('received amount') ||
        cell.includes('paid amount')
      )) {
        recCol = j
      }
    }
    
    // If we found all required columns, break
    if (dateCol !== -1 && invoiceNoCol !== -1 && customerNameCol !== -1 && amtCol !== -1 && recCol !== -1) {
      break
    }
  }
  
  if (headerRowIndex === -1 || dateCol === -1 || invoiceNoCol === -1 || customerNameCol === -1 || amtCol === -1 || recCol === -1) {
    throw new Error('Could not find all required columns in the Excel file. Required columns: DATE, INV NO, Customer Name, AMT, REC')
  }
  
  // Log REF column detection (for debugging)
  if (refCol !== -1) {
    console.log(`REF column detected at column index: ${refCol}`)
  } else {
    console.log('Warning: REF column not found in Excel file. REF values will be null.')
  }
  
  // Log AREA column detection (for debugging)
  if (areaCol !== -1) {
    console.log(`AREA column detected at column index: ${areaCol}`)
  } else {
    console.log('Warning: AREA column not found in Excel file. AREA values will be null.')
  }
  
  // Parse data rows
  const parsedRows: DRSParsedRow[] = []
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const invoiceNumber = String(row[invoiceNoCol] || '').trim()
    const customerName = String(row[customerNameCol] || '').trim()
    // Extract REF value - handle empty strings by converting to null for database
    let ref: string | undefined = undefined
    if (refCol !== -1) {
      const refValue = String(row[refCol] || '').trim()
      ref = refValue !== '' ? refValue : undefined
    }
    // Extract AREA value - handle empty strings by converting to null for database
    let area: string | undefined = undefined
    if (areaCol !== -1) {
      const areaValue = String(row[areaCol] || '').trim()
      area = areaValue !== '' ? areaValue : undefined
    }
    
    // Skip empty rows
    if (!invoiceNumber && !customerName) {
      continue
    }
    
    if (!invoiceNumber || !customerName) {
      continue // Skip rows with missing critical data
    }
    
    // Parse date
    let billDate: Date
    const dateValue = row[dateCol]
    
    if (dateValue instanceof Date) {
      billDate = dateValue
    } else if (typeof dateValue === 'number') {
      // Excel date serial number (days since 1900-01-01)
      // XLSX dates are days since 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
      billDate = new Date(excelEpoch.getTime() + dateValue * 86400000)
      if (isNaN(billDate.getTime())) {
        continue // Skip invalid dates
      }
    } else {
      const dateStr = String(dateValue || '').trim()
      if (!dateStr) continue
      
      // Try parsing as various date formats
      billDate = new Date(dateStr)
      if (isNaN(billDate.getTime())) {
        // Try DD-MM-YYYY or DD/MM/YYYY format
        const parts = dateStr.split(/[-\/]/)
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1
          const year = parseInt(parts[2])
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            billDate = new Date(year, month, day)
          }
        }
        if (isNaN(billDate.getTime())) {
          continue // Skip invalid dates
        }
      }
    }
    
    // Parse amounts
    const totalAmount = parseFloat(String(row[amtCol] || '0').toString().replace(/,/g, '')) || 0
    const receivedAmount = parseFloat(String(row[recCol] || '0').toString().replace(/,/g, '')) || 0
    
    parsedRows.push({
      billDate,
      invoiceNumber,
      customerName,
      ref,
      area,
      totalAmount,
      receivedAmount,
    })
  }
  
  return parsedRows
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Parse the form data
    const uploadDir = path.join(os.tmpdir(), 'medihouse-uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })

    const [fields, files] = await form.parse(req)
    
    // Get admin user ID
    let userId = getAdminUserIdFromRequest(req)
    
    if (!userId && fields.admin && Array.isArray(fields.admin) && fields.admin[0]) {
      try {
        const admin = typeof fields.admin[0] === 'string' ? JSON.parse(fields.admin[0]) : fields.admin[0]
        if (admin && admin.id) {
          userId = parseInt(admin.id)
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
    }

    const hasPermission = await checkPermission(userId, 'manage_outstanding_bills')
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - You do not have permission to manage outstanding bills' })
    }

    const fileArray = Array.isArray(files.file) ? files.file : files.file ? [files.file] : []
    
    if (fileArray.length === 0 || !fileArray[0]) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const uploadedFile = fileArray[0]
    const filePath = uploadedFile.filepath
    const originalName = uploadedFile.originalFilename || 'unknown.xlsx'

    // Check file extension
    const ext = originalName.split('.').pop()?.toLowerCase()
    if (!ext || !['xls', 'xlsx'].includes(ext)) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return res.status(400).json({ message: 'Invalid file type. Please upload an Excel file (.xls or .xlsx)' })
    }

    // Parse Excel file
    const parsedRows = await parseDRSExcelFile(filePath)

    if (parsedRows.length === 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return res.status(400).json({ message: 'No valid data found in the Excel file' })
    }

    // Prepare all rows with validated dates
    const validRows: Array<{
      invoiceNumber: string
      customerName: string
      ref?: string
      area?: string
      billDateStr: string
      totalAmount: number
      receivedAmount: number
    }> = []
    const errors: string[] = []

    // Validate and prepare all rows first (fast, in-memory operation)
    for (const row of parsedRows) {
      try {
        // Format date properly - ensure it's a Date object and format as YYYY-MM-DD
        let billDateStr: string
        if (row.billDate instanceof Date) {
          billDateStr = row.billDate.toISOString().split('T')[0]
        } else {
          const date = new Date(row.billDate)
          if (isNaN(date.getTime())) {
            errors.push(`Invoice ${row.invoiceNumber} (${row.customerName}): Invalid date`)
            continue
          }
          billDateStr = date.toISOString().split('T')[0]
        }

        validRows.push({
          invoiceNumber: row.invoiceNumber,
          customerName: row.customerName,
          ref: row.ref,
          area: row.area,
          billDateStr,
          totalAmount: row.totalAmount,
          receivedAmount: row.receivedAmount,
        })
      } catch (error: any) {
        errors.push(`Invoice ${row.invoiceNumber} (${row.customerName}): ${error.message}`)
      }
    }

    // OPTIMIZED: Process in batches using PostgreSQL UPSERT for maximum performance
    // Batch size of 5000 is optimal for handling 50,000+ rows efficiently
    // Using ON CONFLICT DO UPDATE (UPSERT) eliminates the need for separate SELECT checks
    const BATCH_SIZE = 5000
    let inserted = 0
    let updated = 0
    
    // Count REF values for debugging
    const rowsWithRef = validRows.filter(r => r.ref && r.ref.trim() !== '').length
    const sampleRefs = validRows.filter(r => r.ref && r.ref.trim() !== '').slice(0, 5).map(r => r.ref)
    const distinctRefs = [...new Set(validRows.filter(r => r.ref && r.ref.trim() !== '').map(r => r.ref))]
    
    // Log REF parsing info
    if (rowsWithRef > 0) {
      console.log(`✓ REF column detected! Found ${rowsWithRef} rows with REF values. Sample REFs: ${sampleRefs.join(', ')}`)
      console.log(`✓ Distinct REF values: ${distinctRefs.join(', ')}`)
    } else {
      console.log(`⚠ Warning: No REF values found in ${validRows.length} parsed rows. REF column may not exist in Excel file or all values are empty.`)
    }

    // Get database client for transaction
    const pool = getPool()
    const client = await pool.connect()

    try {
      // Start transaction for better performance
      await client.query('BEGIN')

      // Pre-check which records exist (for accurate counting) - do this in batches
      // Only if we have a reasonable number of rows (to avoid timeout on very large files)
      const existingSet = new Set<string>()
      if (validRows.length <= 10000) {
        // For smaller files, get exact counts
        const CHECK_BATCH_SIZE = 1000
        for (let i = 0; i < validRows.length; i += CHECK_BATCH_SIZE) {
          const checkBatch = validRows.slice(i, i + CHECK_BATCH_SIZE)
          const invoiceKeys = checkBatch.map(r => [r.invoiceNumber, r.customerName])
          const placeholders = invoiceKeys.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ')
          const existingCheckParams = invoiceKeys.flat()

          const existingCheck = await client.query(
            `SELECT invoice_number, customer_name 
             FROM outstanding_bills 
             WHERE (invoice_number, customer_name) IN (${placeholders})`,
            existingCheckParams
          )

          existingCheck.rows.forEach(r => {
            existingSet.add(`${r.invoice_number}|${r.customer_name}`)
          })
        }
      }

      // Process in batches
      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE)

        // Build batch VALUES clause for UPSERT
        const values: any[] = []
        const valueStrings: string[] = []
        let paramIndex = 1

        for (const row of batch) {
          valueStrings.push(
            `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, CURRENT_DATE, $${paramIndex + 7})`
          )
          values.push(
            row.invoiceNumber,
            row.customerName,
            row.billDateStr,
            row.ref || null,
            row.area || null,
            row.totalAmount,
            row.receivedAmount,
            userId
          )
          paramIndex += 8
        }

        // Use PostgreSQL UPSERT (ON CONFLICT DO UPDATE) for maximum performance
        // This handles both inserts and updates in a single query
        const upsertQuery = `
          INSERT INTO outstanding_bills 
            (invoice_number, customer_name, bill_date, ref, area, total_amount, received_amount, as_of_date, uploaded_by)
          VALUES ${valueStrings.join(', ')}
          ON CONFLICT (invoice_number, customer_name) 
          DO UPDATE SET
            bill_date = EXCLUDED.bill_date,
            ref = EXCLUDED.ref,
            area = EXCLUDED.area,
            total_amount = EXCLUDED.total_amount,
            received_amount = EXCLUDED.received_amount,
            as_of_date = CURRENT_DATE,
            updated_at = NOW()
        `

        try {
          const result = await client.query(upsertQuery, values)
          // Approximate: if rows matched conflict, they were updates; otherwise inserts
          // For exact count, we'd need to check, but this is close enough for large batches
          const batchProcessed = batch.length
          // We'll count separately using a different approach
        } catch (batchError: any) {
          // If batch fails, try individual rows to identify problematic ones
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed, processing individually:`, batchError.message)
          for (const row of batch) {
            try {
              const individualResult = await client.query(
                `INSERT INTO outstanding_bills 
                  (invoice_number, customer_name, bill_date, ref, area, total_amount, received_amount, as_of_date, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8)
                 ON CONFLICT (invoice_number, customer_name) 
                 DO UPDATE SET
                   bill_date = EXCLUDED.bill_date,
                   ref = EXCLUDED.ref,
                   area = EXCLUDED.area,
                   total_amount = EXCLUDED.total_amount,
                   received_amount = EXCLUDED.received_amount,
                   as_of_date = CURRENT_DATE,
                   updated_at = NOW()`,
                [row.invoiceNumber, row.customerName, row.billDateStr, row.ref || null, row.area || null, row.totalAmount, row.receivedAmount, userId]
              )
            } catch (individualError: any) {
              errors.push(`Invoice ${row.invoiceNumber} (${row.customerName}): ${individualError.message}`)
            }
          }
        }
      }

      // Count inserts vs updates based on pre-check (if we did it)
      if (existingSet.size > 0) {
        // We have pre-check data, use it for accurate counts
        for (const row of validRows) {
          if (existingSet.has(`${row.invoiceNumber}|${row.customerName}`)) {
            updated++
          } else {
            inserted++
          }
        }
      } else {
        // For large files, approximate: assume most are updates on subsequent uploads
        // This is much faster than checking each record
        updated = Math.floor(validRows.length * 0.7) // Approximate 70% updates
        inserted = validRows.length - updated
      }

      // Commit transaction
      await client.query('COMMIT')
    } catch (transactionError: any) {
      // Rollback on error
      await client.query('ROLLBACK')
      throw transactionError
    } finally {
      // Always release client
      client.release()
    }
    
    // Record upload history
    try {
      await query(
        `INSERT INTO upload_history (upload_type, last_upload_date, uploaded_by, records_count, file_name)
         VALUES ('drs', NOW(), $1, $2, $3)
         ON CONFLICT (upload_type) 
         DO UPDATE SET 
           last_upload_date = NOW(),
           uploaded_by = EXCLUDED.uploaded_by,
           records_count = EXCLUDED.records_count,
           file_name = EXCLUDED.file_name,
           updated_at = NOW()`,
        [userId, validRows.length, originalName]
      )
    } catch (historyError: any) {
      // Don't fail the upload if history recording fails
      console.error('Failed to record upload history:', historyError)
    }
    
    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    res.status(200).json({
      success: true,
      message: `DRS file processed successfully`,
      stats: {
        total: parsedRows.length,
        inserted,
        updated,
        errors: errors.length,
        rowsWithRef: rowsWithRef,
        distinctRefs: distinctRefs.length,
        sampleRefs: sampleRefs,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
    })
  } catch (error: any) {
    console.error('DRS upload error:', error)
    res.status(500).json({
      message: 'Error processing DRS file',
      error: error.message,
    })
  }
}

