import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
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

interface StockUpdate {
  productName: string
  stockQuantity: number
}

async function parseExcelFile(filePath: string): Promise<StockUpdate[]> {
  // Ensure file exists before attempting to read
  if (!fs.existsSync(filePath)) {
    throw new Error(`Uploaded file not found at path: ${filePath}`)
  }

  // Read the file into a buffer first to avoid path access issues on some platforms
  let workbook
  try {
    const fileBuffer = fs.readFileSync(filePath)

    // Read buffer with options to handle both .xls and .xlsx formats
    workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: false,
      cellNF: false,
      cellText: false,
    })
  } catch (readError: any) {
    const errorMsg = readError.message || 'Unknown error reading file'
    console.error('XLSX.readFile error:', errorMsg)
    console.error('File path:', filePath)
    console.error('File exists:', fs.existsSync(filePath))
    throw new Error(`Failed to read Excel file: ${errorMsg}. Please ensure the file is a valid Excel file (.xls or .xlsx format).`)
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
    throw new Error(`Failed to parse Excel data: ${parseError.message || 'Unknown parsing error'}`)
  }
  
  if (data.length === 0) {
    throw new Error('Excel file is empty')
  }
  
  // Find header row and columns
  let headerRowIndex = -1
  let productNameCol = -1
  let stockCol = -1
  
  // Search first 20 rows for headers
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim()
      
      // Check for product name column
      if (productNameCol === -1 && (
        cell.includes('product') || 
        cell.includes('name') ||
        cell.includes('item') ||
        cell.includes('medicine') ||
        cell.includes('drug')
      )) {
        productNameCol = j
      }
      
      // Check for stock column
      if (stockCol === -1 && (
        cell.includes('stock') || 
        cell.includes('quantity') || 
        cell.includes('qty') ||
        cell.includes('qnty') ||
        cell.includes('available') ||
        cell.includes('balance')
      )) {
        stockCol = j
      }
    }
    
    // If we found both columns, this is likely the header row
    if (productNameCol >= 0 && stockCol >= 0) {
      headerRowIndex = i
      break
    }
  }
  
  // If we found columns but no clear header row, use first row
  if (headerRowIndex === -1 && productNameCol >= 0 && stockCol >= 0) {
    headerRowIndex = 0
  }
  
  // Fallback: assume first column is product name, look for numeric column for stock
  if (productNameCol === -1) {
    productNameCol = 0
  }
  
  if (stockCol === -1) {
    // Find first numeric column after product name column
    const firstRow = data[headerRowIndex >= 0 ? headerRowIndex : 0] || []
    for (let j = productNameCol + 1; j < firstRow.length; j++) {
      const cell = firstRow[j]
      const cellStr = String(cell || '').trim()
      // Check if it's a number or looks like a quantity
      if (!isNaN(parseFloat(cellStr)) && cellStr !== '') {
        stockCol = j
        break
      }
    }
    // If still not found, use column after product name
    if (stockCol === -1) {
      stockCol = productNameCol + 1
    }
  }
  
  const updates: StockUpdate[] = []
  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 1
  
  // Process rows
  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const productName = String(row[productNameCol] || '').trim()
    
    // Skip empty rows or rows that look like headers
    if (!productName || 
        productName.toLowerCase() === 'product' ||
        productName.toLowerCase() === 'name' ||
        productName.toLowerCase().includes('total') ||
        productName.toLowerCase().includes('sum')) {
      continue
    }
    
    const stockValue = row[stockCol]
    
    // Parse stock quantity
    let stockQuantity = 0
    if (stockValue !== null && stockValue !== undefined && stockValue !== '') {
      const stockStr = String(stockValue).trim().replace(/,/g, '').replace(/[^\d.-]/g, '')
      const parsed = parseFloat(stockStr)
      if (!isNaN(parsed) && parsed >= 0) {
        stockQuantity = Math.floor(Math.abs(parsed))
      }
    }
    
    // Only add if we have a product name
    if (productName) {
      updates.push({
        productName,
        stockQuantity,
      })
    }
  }
  
  return updates
}

// Helper function to verify admin token
function verifyAdminToken(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  // In production, verify JWT token properly
  // For now, check if token exists and starts with 'admin_token_'
  return token.startsWith('admin_token_')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Start timing
    const startTime = Date.now()
    
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
    
    // Get admin user ID - check headers first, then form fields
    let userId = getAdminUserIdFromRequest(req)
    
    // If not found in headers, check form fields
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

    const hasPermission = await checkPermission(userId, 'manage_stock')
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - You do not have permission to manage stock' })
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
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return res.status(400).json({ message: 'Invalid file type. Please upload an Excel file (.xls or .xlsx)' })
    }

    // Parse Excel file
    const stockUpdates = await parseExcelFile(filePath)

    if (stockUpdates.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return res.status(400).json({ message: 'No valid product data found in the Excel file' })
    }

    // Group by product name and sum stock quantities
    const stockByProduct = new Map<string, number>()
    
    for (const update of stockUpdates) {
      const productName = update.productName.trim()
      const currentStock = stockByProduct.get(productName) || 0
      stockByProduct.set(productName, currentStock + update.stockQuantity)
    }

    // Update database using optimized chunked batch processing to prevent timeouts
    let updated = 0
    let notFound = 0
    const errors: string[] = []
    
    // Get all product names to find in chunks (to avoid query size limits)
    const productNames = Array.from(stockByProduct.keys())
    const BATCH_SIZE = 1000 // Process products in batches to avoid timeout
    const UPDATE_BATCH_SIZE = 500 // Update database in smaller batches
    
    // Find all matching products in chunks (prevents large query timeouts)
    const productMap = new Map<string, { id: number; name: string }>()
    
    for (let i = 0; i < productNames.length; i += BATCH_SIZE) {
      const nameBatch = productNames.slice(i, i + BATCH_SIZE)
      const findProductsResult = await query(
        `SELECT id, LOWER(name) as lower_name, name 
         FROM products 
         WHERE LOWER(name) = ANY($1::text[])`,
        [nameBatch.map(n => n.toLowerCase())]
      )
      
      for (const row of findProductsResult.rows) {
        const lowerName = row.lower_name
        if (!productMap.has(lowerName)) {
          productMap.set(lowerName, { id: row.id, name: row.name })
        }
      }
    }
    
    // Prepare batch updates - group by product ID
    const updatesByProductId = new Map<number, number>()
    const notFoundProducts: string[] = []
    
    for (const [productName, totalStock] of stockByProduct.entries()) {
      const lowerName = productName.toLowerCase()
      const product = productMap.get(lowerName)
      
      if (product) {
        // If multiple products with same name, use the first one
        updatesByProductId.set(product.id, totalStock)
      } else {
        notFoundProducts.push(productName)
        notFound++
        errors.push(`Product not found: "${productName}"`)
      }
    }
    
    // Perform chunked batch updates to prevent timeout on large datasets
    if (updatesByProductId.size > 0) {
      const updateEntries = Array.from(updatesByProductId.entries())
      
      // Process updates in chunks
      for (let i = 0; i < updateEntries.length; i += UPDATE_BATCH_SIZE) {
        const updateBatch = updateEntries.slice(i, i + UPDATE_BATCH_SIZE)
        
        try {
          // Build VALUES clause for this batch
          const values: any[] = []
          const valueStrings: string[] = []
          let paramIndex = 1
          
          for (const [productId, stock] of updateBatch) {
            valueStrings.push(`($${paramIndex}, $${paramIndex + 1})`)
            values.push(productId, stock)
            paramIndex += 2
          }
          
          // Batch update query for this chunk
          const batchUpdateQuery = `
            UPDATE products p
            SET stock_quantity = v.stock,
                updated_at = NOW()
            FROM (VALUES ${valueStrings.join(', ')}) AS v(id, stock)
            WHERE p.id = v.id
          `
          
          await query(batchUpdateQuery, values)
          updated += updateBatch.length
        } catch (batchError: any) {
          console.error(`Batch update failed for chunk ${i / UPDATE_BATCH_SIZE + 1}, falling back to individual updates:`, batchError.message)
          // Fallback to individual updates for this chunk if batch fails
          for (const [productId, stock] of updateBatch) {
            try {
              await query(
                `UPDATE products 
                 SET stock_quantity = $1, updated_at = NOW() 
                 WHERE id = $2`,
                [stock, productId]
              )
              updated++
            } catch (individualError: any) {
              errors.push(`Error updating product ID ${productId}: ${individualError.message}`)
            }
          }
        }
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Calculate elapsed time
    const endTime = Date.now()
    const elapsedTime = endTime - startTime
    const elapsedSeconds = (elapsedTime / 1000).toFixed(2)
    const elapsedMs = elapsedTime
    
    // Calculate minutes and seconds
    const totalSeconds = Math.floor(elapsedTime / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    // Format as "X minutes Y seconds" or "Y seconds" if less than a minute
    let formattedMinutesSeconds = ''
    if (minutes > 0) {
      formattedMinutesSeconds = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
    } else {
      formattedMinutesSeconds = `${seconds} second${seconds !== 1 ? 's' : ''}`
    }

    // No caching - ensure real-time responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    res.status(200).json({
      success: true,
      message: 'Stock update completed',
      stats: {
        total: stockUpdates.length,
        uniqueProducts: stockByProduct.size,
        updated,
        notFound,
      },
      timing: {
        elapsedMs,
        elapsedSeconds: parseFloat(elapsedSeconds),
        minutes,
        seconds,
        formatted: elapsedTime < 1000 
          ? `${elapsedMs}ms` 
          : elapsedTime < 60000 
            ? `${elapsedSeconds}s` 
            : `${minutes}m ${seconds}s`,
        formattedMinutesSeconds
      },
      errors: errors.slice(0, 10), // Limit to first 10 errors
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    
    // Return detailed error message
    const errorMessage = error.message || 'Unknown error occurred while processing the file'
    res.status(500).json({
      message: 'Error processing file',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

