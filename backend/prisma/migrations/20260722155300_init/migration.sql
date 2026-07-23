-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeslaCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeslaCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teslaId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revenueCatAppUserId" TEXT NOT NULL,
    "entitlement" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "store" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrivingSession" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "energyUsedKwh" DOUBLE PRECISION NOT NULL,
    "efficiencyWhPerKm" DOUBLE PRECISION NOT NULL,
    "averageSpeedKmh" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DrivingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeslaCredential_userId_key" ON "TeslaCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_teslaId_key" ON "Vehicle"("teslaId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_revenueCatAppUserId_key" ON "Subscription"("revenueCatAppUserId");

-- CreateIndex
CREATE INDEX "DrivingSession_vehicleId_startedAt_idx" ON "DrivingSession"("vehicleId", "startedAt");

-- AddForeignKey
ALTER TABLE "TeslaCredential" ADD CONSTRAINT "TeslaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrivingSession" ADD CONSTRAINT "DrivingSession_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
