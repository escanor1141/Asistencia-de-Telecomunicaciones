import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const dateFilter = {}
        if (startDate) dateFilter.gte = startDate
        if (endDate) dateFilter.lte = endDate

        const whereClause = { courseId }
        if (Object.keys(dateFilter).length > 0) {
            whereClause.date = dateFilter
        }

        const attendances = await prisma.attendance.findMany({
            where: whereClause,
            include: { student: true }
        })

        // Group by student
        const studentStats = {}

        attendances.forEach(att => {
            const sid = att.student.id
            if (!studentStats[sid]) {
                studentStats[sid] = {
                    id: sid,
                    name: att.student.name,
                    total: 0,
                    present: 0
                }
            }
            studentStats[sid].total += 1
            if (att.present) {
                studentStats[sid].present += 1
            }
        })

        const result = Object.values(studentStats).map(stat => ({
            ...stat,
            percentage: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage)

        return Response.json(result)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
