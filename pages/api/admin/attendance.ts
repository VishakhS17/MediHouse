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
      const { employeeId, attendanceDate, status, notes, latitude, longitude, locationAddress } = req.body

      if (!employeeId || !attendanceDate || !status) {
        return res.status(400).json({
          message: 'Employee ID, attendance date, and status are required',
        })
      }

      if (!['present', 'half_day', 'leave', 'optional_holiday'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be: present, half_day, leave, or optional_holiday',
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

      // Check if attendance already exists for this employee and date
      const existingCheck = await query(
        `SELECT id, status, created_at FROM attendance 
         WHERE employee_id = $1 AND attendance_date = $2`,
        [employeeId, attendanceDate]
      )

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'Attendance already marked for this employee on this date. Only super admins can edit existing attendance.',
        })
      }

      // Insert attendance (no update on conflict since we prevent duplicates)
      const result = await query(
        `INSERT INTO attendance (employee_id, attendance_date, status, marked_by, notes, latitude, longitude, location_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, employee_id, attendance_date, status, notes, latitude, longitude, location_address, created_at`,
        [employeeId, attendanceDate, status, userId, notes || null, latitude || null, longitude || null, locationAddress || null]
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
          a.latitude,
          a.longitude,
          a.location_address,
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

      queryStr += ` ORDER BY a.attendance_date DESC, a.created_at ASC`

      const result = await query(queryStr, params)

      // Check if Excel download is requested
      if (download === 'true' || download === 'excel') {
        // Build employee-wise pivot format: Employee Name | <date> | <date> | ...
        const formatStatus = (status: string) =>
          status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')

        const formatDateKey = (dateValue: string | Date) => {
          const date = new Date(dateValue)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const uniqueDates = Array.from(
          new Set(result.rows.map((row) => formatDateKey(row.attendance_date)))
        ).sort()

        const employeeMap = new Map<
          string,
          {
            name: string
            byDate: Record<string, string>
          }
        >()

        result.rows.forEach((row) => {
          const employeeKey = `${row.employee_id}`
          const attendanceDate = formatDateKey(row.attendance_date)

          if (!employeeMap.has(employeeKey)) {
            employeeMap.set(employeeKey, {
              name: row.employee_name,
              byDate: {},
            })
          }

          const employee = employeeMap.get(employeeKey)!
          employee.byDate[attendanceDate] = formatStatus(row.status)
        })

        const headerRow: string[] = ['Employee Name', ...uniqueDates]

        const sheetData: (string | number)[][] = [headerRow]
        Array.from(employeeMap.values()).forEach((employee) => {
          const row: (string | number)[] = [
            employee.name,
            ...uniqueDates.map((date) => employee.byDate[date] || ''),
          ]
          sheetData.push(row)
        })

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
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
  } else if (req.method === 'PUT') {
    // Edit attendance (super admin only, can change to any status)
    try {
      const { id, status } = req.body

      if (!id || !status) {
        return res.status(400).json({
          message: 'Attendance ID and status are required',
        })
      }

      // Validate status
      if (!['present', 'half_day', 'leave', 'optional_holiday'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be: present, half_day, leave, or optional_holiday',
        })
      }

      // Check if user is super admin
      const userRoleCheck = await query(
        `SELECT r.name as role_name
         FROM admin_users au
         LEFT JOIN admin_roles r ON au.role_id = r.id
         WHERE au.id = $1`,
        [userId]
      )

      const isSuperAdmin = userRoleCheck.rows[0]?.role_name === 'super_admin'

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: 'Forbidden - Only super admins can edit attendance',
        })
      }

      // Check if attendance record exists
      const attendanceCheck = await query(
        `SELECT id, status, employee_id, attendance_date 
         FROM attendance 
         WHERE id = $1`,
        [id]
      )

      if (attendanceCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Attendance record not found',
        })
      }

      // Update attendance to new status
      const result = await query(
        `UPDATE attendance 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, employee_id, attendance_date, status, notes, updated_at`,
        [status, id]
      )

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Edit attendance error:', error)
      res.status(500).json({
        message: 'Error updating attendance',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}




