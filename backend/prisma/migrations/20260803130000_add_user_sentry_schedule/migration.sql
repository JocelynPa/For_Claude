ALTER TABLE "User"
  ADD COLUMN "sentryScheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sentryScheduleStart" TEXT NOT NULL DEFAULT '20:00',
  ADD COLUMN "sentryScheduleEnd" TEXT NOT NULL DEFAULT '07:00',
  ADD COLUMN "sentryScheduleDays" TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
  ADD COLUMN "sentryScheduleTimezone" TEXT NOT NULL DEFAULT 'Europe/Paris';
