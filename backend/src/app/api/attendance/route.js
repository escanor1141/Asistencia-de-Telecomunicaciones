import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        if (!date) {
            // Use raw query to get present count per day (groupBy with _sum on boolean is unsupported in Prisma)
            const historyRaw = await prisma.$queryRaw`
        SELECT 
          date, 
          COUNT(id) as "total", 
          SUM(CASE WHEN present THEN 1 ELSE 0 END) as "presentCount" 
        FROM "Attendance" 
        WHERE "courseId" = ${courseId}
        GROUP BY date 
        ORDER BY date DESC
      `

            // Transform BigInt to Number if needed
            const history = historyRaw.map(row => ({
                date: row.date,
                total: Number(row.total),
                presentCount: Number(row.presentCount || 0)
            }))

            return Response.json(history)
        }

        const attendances = await prisma.attendance.findMany({
            where: { date, courseId },
            include: { student: true }
        })
        return Response.json(attendances)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { date, courseId, records } = await request.json()
        // records: Array<{ studentId: string, present: boolean }>
        if (!date || !courseId || !Array.isArray(records)) {
            return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Save multiple records in a single transaction using upsert
        const operations = records.map(record => {
            return prisma.attendance.upsert({
                where: {
                    studentId_courseId_date: {
                        studentId: record.studentId,
                        courseId,
                        date
                    }
                },
                update: { present: record.present },
                create: {
                    studentId: record.studentId,
                    courseId,
                    date,
                    present: record.present
                }
            })
        })

        await prisma.$transaction(operations)

        return Response.json({ success: true, count: operations.length })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to save attendance' }, { status: 500 })
    }
}
