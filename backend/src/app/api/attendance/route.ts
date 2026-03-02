import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')

        if (!date) {
            // Use raw query to get present count per day (groupBy with _sum on boolean is unsupported in Prisma)
            const historyRaw = await prisma.$queryRaw`
        SELECT 
          date, 
          COUNT(id) as "total", 
          SUM(CASE WHEN present THEN 1 ELSE 0 END) as "presentCount" 
        FROM "Attendance" 
        GROUP BY date 
        ORDER BY date DESC
      `

            // Transform BigInt to Number if needed
            const history = (historyRaw as any[]).map(row => ({
                date: row.date,
                total: Number(row.total),
                presentCount: Number(row.presentCount || 0)
            }))

            return NextResponse.json(history)
        }

        const attendances = await prisma.attendance.findMany({
            where: { date },
            include: { student: true }
        })
        return NextResponse.json(attendances)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const { date, records } = await request.json()
        // records: Array<{ studentId: string, present: boolean }>
        if (!date || !Array.isArray(records)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // Save multiple records in a single transaction using upsert
        const operations = records.map(record => {
            return prisma.attendance.upsert({
                where: {
                    studentId_date: {
                        studentId: record.studentId,
                        date
                    }
                },
                update: { present: record.present },
                create: {
                    studentId: record.studentId,
                    date,
                    present: record.present
                }
            })
        })

        await prisma.$transaction(operations)

        return NextResponse.json({ success: true, count: operations.length })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
    }
}
