import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const dateFilter: any = {}
        if (startDate) dateFilter.gte = startDate
        if (endDate) dateFilter.lte = endDate

        const attendances = await prisma.attendance.findMany({
            where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
            include: { student: true }
        })

        // Group by student
        const studentStats: Record<string, { id: string, name: string, total: number, present: number }> = {}

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

        return NextResponse.json(result)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
