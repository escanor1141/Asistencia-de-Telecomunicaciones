import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const attendances = await prisma.attendance.findMany({
            include: { student: true },
            orderBy: { date: 'desc' }
        })

        const header = ['Student ID', 'Name', 'Date', 'Present', 'Created At']

        // Simple CSV builder dealing with basic commas
        const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`

        const rows = attendances.map(a => [
            escapeCsv(a.student.id),
            escapeCsv(a.student.name),
            escapeCsv(a.date),
            a.present ? 'Yes' : 'No',
            escapeCsv(a.createdAt.toISOString())
        ])

        const csvContent = [header.map(escapeCsv).join(","), ...rows.map(e => e.join(","))].join("\n")

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="attendance_export.csv"',
            }
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
    }
}
