-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_studentId_weekStart_key" ON "NotificationLog"("studentId", "weekStart");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
