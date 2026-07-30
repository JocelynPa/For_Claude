-- CreateTable
CREATE TABLE "SentryTimelineEntry" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "activityDescription" TEXT,
    "awarenessLevel" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentryTimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentryTimelineEntry_vin_date_idx" ON "SentryTimelineEntry"("vin", "date");
