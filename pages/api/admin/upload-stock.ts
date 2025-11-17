import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
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
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
  
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

  // Verify admin authentication
  // Note: In a real app, you'd verify the token from localStorage/cookie
  // For now, we'll allow it but you should add proper token verification
  // const isAuthenticated = verifyAdminToken(req)
  // if (!isAuthenticated) {
  //   return res.status(401).json({ message: 'Unauthorized' })
  // }

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

    // Update database
    let updated = 0
    let notFound = 0
    const errors: string[] = []

    for (const [productName, totalStock] of stockByProduct.entries()) {
      try {
        // Find product by name (case-insensitive, exact match first, then partial)
        const result = await query(
          `SELECT id, name FROM products 
           WHERE LOWER(name) = LOWER($1) 
           OR LOWER(name) LIKE LOWER($2)
           ORDER BY CASE WHEN LOWER(name) = LOWER($1) THEN 0 ELSE 1 END
           LIMIT 1`,
          [productName, `%${productName}%`]
        )

        if (result.rows.length > 0) {
          await query(
            `UPDATE products 
             SET stock_quantity = $1, updated_at = NOW() 
             WHERE id = $2`,
            [totalStock, result.rows[0].id]
          )
          updated++
        } else {
          notFound++
          errors.push(`Product not found: "${productName}"`)
        }
      } catch (error: any) {
        errors.push(`Error updating "${productName}": ${error.message}`)
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.status(200).json({
      success: true,
      message: 'Stock update completed',
      stats: {
        total: stockUpdates.length,
        uniqueProducts: stockByProduct.size,
        updated,
        notFound,
      },
      errors: errors.slice(0, 10), // Limit to first 10 errors
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    res.status(500).json({
      message: 'Error processing file',
      error: error.message,
    })
  }
}

