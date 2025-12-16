import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getAdminUserIdFromRequest } from '@/lib/adminPermissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get upload history for both stock and drs
    const result = await query(
      `SELECT upload_type, last_upload_date, uploaded_by, records_count, file_name,
              au.name as uploaded_by_name
       FROM upload_history uh
       LEFT JOIN admin_users au ON uh.uploaded_by = au.id
       WHERE upload_type IN ('stock', 'drs')
       ORDER BY upload_type`
    )

    // Format the response
    const history: Record<string, any> = {}
    for (const row of result.rows) {
      history[row.upload_type] = {
        lastUploadDate: row.last_upload_date,
        uploadedBy: row.uploaded_by_name || 'Unknown',
        recordsCount: row.records_count || 0,
        fileName: row.file_name || null,
      }
    }

    res.status(200).json({
      success: true,
      history: {
        stock: history.stock || null,
        drs: history.drs || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching upload history:', error)
    // If table doesn't exist yet, return empty history
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return res.status(200).json({
        success: true,
        history: {
          stock: null,
          drs: null,
        },
      })
    }
    
    res.status(500).json({
      message: 'Error fetching upload history',
      error: error.message,
    })
  }
}

