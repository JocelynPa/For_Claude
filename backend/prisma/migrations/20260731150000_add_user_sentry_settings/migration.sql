-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sentryAutoAction" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "pushToken" TEXT;
