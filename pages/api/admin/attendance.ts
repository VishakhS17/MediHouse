import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check permission for all methods
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'manage_attendance')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to manage attendance' })
  }

  if (req.method === 'POST') {
    // Mark attendance
    try {
      const { employeeId, attendanceDate, status, notes } = req.body

      if (!employeeId || !attendanceDate || !status) {
        return res.status(400).json({
          message: 'Employee ID, attendance date, and status are required',
        })
      }

      if (!['present', 'absent', 'half_day', 'leave'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be: present, absent, half_day, or leave',
        })
      }

      // Check if employee exists and has employee role
      const employeeCheck = await query(
        `SELECT au.id, au.name, r.name as role_name
         FROM admin_users au
         LEFT JOIN admin_roles r ON au.role_id = r.id
         WHERE au.id = $1 AND r.name = 'employee'`,
        [employeeId]
      )

      if (employeeCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Employee not found or user is not an employee',
        })
      }

      // Insert or update attendance
      const result = await query(
        `INSERT INTO attendance (employee_id, attendance_date, status, marked_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id, attendance_date)
         DO UPDATE SET 
           status = EXCLUDED.status,
           marked_by = EXCLUDED.marked_by,
           notes = EXCLUDED.notes,
           updated_at = NOW()
         RETURNING id, employee_id, attendance_date, status, notes, created_at`,
        [employeeId, attendanceDate, status, userId, notes || null]
      )

      res.status(200).json({
        success: true,
        message: 'Attendance marked successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Mark attendance error:', error)
      res.status(500).json({
        message: 'Error marking attendance',
        error: error.message,
      })
    }
  } else if (req.method === 'GET') {
    // Get attendance records
    try {
      const { startDate, endDate, employeeId, download } = req.query

      let queryStr = `
        SELECT 
          a.id,
          a.employee_id,
          a.attendance_date,
          a.status,
          a.notes,
          a.created_at,
          a.updated_at,
          au.name as employee_name,
          au.email as employee_email,
          marked_by_admin.name as marked_by_name
        FROM attendance a
        INNER JOIN admin_users au ON a.employee_id = au.id
        LEFT JOIN admin_users marked_by_admin ON a.marked_by = marked_by_admin.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        queryStr += ` AND a.attendance_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        queryStr += ` AND a.attendance_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (employeeId) {
        queryStr += ` AND a.employee_id = $${paramIndex}`
        params.push(parseInt(employeeId as string))
        paramIndex++
      }

      queryStr += ` ORDER BY a.attendance_date DESC, au.name ASC`

      const result = await query(queryStr, params)

      // Check if Excel download is requested
      if (download === 'true' || download === 'excel') {
        // Generate Excel file
        const excelData = result.rows.map((row) => ({
          'Date': new Date(row.attendance_date).toLocaleDateString('en-IN'),
          'Employee Name': row.employee_name,
          'Employee Email': row.employee_email,
          'Status': row.status.charAt(0).toUpperCase() + row.status.slice(1).replace('_', ' '),
          'Marked By': row.marked_by_name || '',
          'Notes': row.notes || '',
          'Marked At': new Date(row.created_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

        let filename = 'Attendance'
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate as string).toISOString().split('T')[0] : 'all'
          const end = endDate ? new Date(endDate as string).toISOString().split('T')[0] : 'all'
          filename += `_${start}_to_${end}`
        }
        filename += `_${new Date().toISOString().split('T')[0]}.xlsx`

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(excelBuffer)
        return
      }

      res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      })
    } catch (error: any) {
      console.error('Get attendance error:', error)
      res.status(500).json({
        message: 'Error fetching attendance',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}


