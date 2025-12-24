import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check permission for all methods
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'manage_outstanding_bills')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to view outstanding bills' })
  }

  if (req.method === 'GET') {
    try {
      const { customerNumber, customerName, invoiceNumber, ref, refValues, area, areaValues, sortBy, sortOrder, limit = '50', offset = '0' } = req.query

      // If refValues is requested, return distinct REF values
      if (refValues === 'true') {
        try {
          const distinctRefsResult = await query(
            `SELECT DISTINCT ref 
             FROM outstanding_bills 
             WHERE ref IS NOT NULL AND ref != ''
             ORDER BY ref ASC`
          )
          const refValues = distinctRefsResult.rows.map(row => row.ref).filter(ref => ref && ref.trim() !== '')
          return res.status(200).json({
            success: true,
            refValues,
          })
        } catch (error: any) {
          console.error('Error fetching distinct REF values:', error)
          return res.status(500).json({
            message: 'Error fetching REF values',
            error: error.message,
          })
        }
      }

      // If areaValues is requested, return distinct area values
      if (areaValues === 'true') {
        try {
          const distinctAreasResult = await query(
            `SELECT DISTINCT area 
             FROM outstanding_bills 
             WHERE area IS NOT NULL AND area != ''
             ORDER BY area ASC`
          )
          const areaValues = distinctAreasResult.rows.map(row => row.area).filter(area => area && area.trim() !== '')
          return res.status(200).json({
            success: true,
            areaValues,
          })
        } catch (error: any) {
          console.error('Error fetching distinct area values:', error)
          return res.status(500).json({
            message: 'Error fetching area values',
            error: error.message,
          })
        }
      }

      // Validate and parse pagination params
      const limitNum = Math.min(parseInt(limit as string) || 50, 500) // Max 500 per page
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0)

      let sql = `
        SELECT 
          id,
          invoice_number,
          customer_name,
          bill_date,
          ref,
          area,
          total_amount,
          received_amount,
          pending_balance,
          as_of_date,
          credit_days,
          created_at,
          updated_at
        FROM outstanding_bills
        WHERE 1=1
      `
      const params: any[] = []
      let paramCount = 0

      // Optimized search - use prefix matching when possible (faster than %term%)
      const searchTerm = customerNumber || customerName || invoiceNumber
      if (searchTerm) {
        paramCount++
        const search = `%${searchTerm}%`
        // Search across all fields in one condition for better index usage
        sql += ` AND (
          customer_name ILIKE $${paramCount} 
          OR invoice_number ILIKE $${paramCount}
        )`
        params.push(search)
      }

      // Filter by REF if provided
      // For "PART OK", include blank/null values; for others, exact match only
      if (ref && ref !== '') {
        paramCount++
        if (ref === 'PART OK') {
          sql += ` AND (ref = $${paramCount} OR ref IS NULL OR ref = '')`
        } else {
          sql += ` AND ref = $${paramCount}`
        }
        params.push(ref)
      }

      // Filter by area if provided
      if (area && area !== '') {
        paramCount++
        sql += ` AND area = $${paramCount}`
        params.push(area)
      }

      // Build count query for pagination
      let countSql = `SELECT COUNT(*) as total FROM outstanding_bills WHERE 1=1`
      const countParams: any[] = []
      let countParamCount = 0
      if (searchTerm) {
        countParamCount++
        countParams.push(`%${searchTerm}%`)
        countSql += ` AND (customer_name ILIKE $${countParamCount} OR invoice_number ILIKE $${countParamCount})`
      }
      if (ref && ref !== '') {
        countParamCount++
        countParams.push(ref)
        if (ref === 'PART OK') {
          countSql += ` AND (ref = $${countParamCount} OR ref IS NULL OR ref = '')`
        } else {
          countSql += ` AND ref = $${countParamCount}`
        }
      }
      if (area && area !== '') {
        countParamCount++
        countParams.push(area)
        countSql += ` AND area = $${countParamCount}`
      }

      // Add pagination and ordering to main query
      // Default sorting: bill_date DESC (newest first), then customer_name, then invoice_number
      let orderByClause = 'ORDER BY bill_date DESC, customer_name ASC, invoice_number ASC'
      
      // Override default sorting if sortBy and sortOrder are provided
      if (sortBy === 'bill_date' && sortOrder) {
        const sortOrderStr = Array.isArray(sortOrder) ? sortOrder[0] : sortOrder
        const order = sortOrderStr.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
        orderByClause = `ORDER BY bill_date ${order}, customer_name ASC, invoice_number ASC`
      }
      
      sql += ` ${orderByClause} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
      params.push(limitNum, offsetNum)

      // Build summary query for totals
      let summarySql = `
        SELECT 
          COUNT(*) as total_records,
          COALESCE(SUM(pending_balance), 0) as total_pending_balance
        FROM outstanding_bills
        WHERE 1=1
      `
      const summaryParams: any[] = []
      let summaryParamCount = 0
      if (searchTerm) {
        summaryParamCount++
        summaryParams.push(`%${searchTerm}%`)
        summarySql += ` AND (customer_name ILIKE $${summaryParamCount} OR invoice_number ILIKE $${summaryParamCount})`
      }
      if (ref && ref !== '') {
        summaryParamCount++
        summaryParams.push(ref)
        if (ref === 'PART OK') {
          summarySql += ` AND (ref = $${summaryParamCount} OR ref IS NULL OR ref = '')`
        } else {
          summarySql += ` AND ref = $${summaryParamCount}`
        }
      }
      if (area && area !== '') {
        summaryParamCount++
        summaryParams.push(area)
        summarySql += ` AND area = $${summaryParamCount}`
      }

      // Execute all queries in parallel for maximum performance
      const queryResults = await Promise.all([
        query(countSql, countParams),
        query(sql, params),
        query(summarySql, summaryParams)
      ])

      const countResult = queryResults[0]
      const dataResult = queryResults[1]
      const summaryResult = queryResults[2]

      const totalRecords = parseInt(countResult.rows[0]?.total || '0')

      res.status(200).json({
        success: true,
        data: dataResult.rows,
        pagination: {
          total: totalRecords,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalRecords,
        },
        summary: {
          totalRecords: parseInt(summaryResult.rows[0]?.total_records || '0'),
          totalPendingBalance: parseFloat(summaryResult.rows[0]?.total_pending_balance || '0').toFixed(2),
        },
      })
    } catch (error: any) {
      console.error('Outstanding bills fetch error:', error)
      res.status(500).json({
        message: 'Error fetching outstanding bills',
        error: error.message,
      })
    }
  } else if (req.method === 'DELETE') {
    // Allow deletion of individual records
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ message: 'Record ID is required' })
      }

      const result = await query(
        'DELETE FROM outstanding_bills WHERE id = $1 RETURNING id, invoice_number, customer_name',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Record not found' })
      }

      res.status(200).json({
        success: true,
        message: 'Record deleted successfully',
        deleted: result.rows[0],
      })
    } catch (error: any) {
      console.error('Outstanding bills delete error:', error)
      res.status(500).json({
        message: 'Error deleting record',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
