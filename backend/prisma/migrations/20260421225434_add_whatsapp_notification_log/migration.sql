-- CreateTable
CREATE TABLE "WhatsappNotificationLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,

    CONSTRAINT "WhatsappNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappNotificationLog_studentId_courseId_date_key" ON "WhatsappNotificationLog"("studentId", "courseId", "date");

-- AddForeignKey
ALTER TABLE "WhatsappNotificationLog" ADD CONSTRAINT "WhatsappNotificationLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
