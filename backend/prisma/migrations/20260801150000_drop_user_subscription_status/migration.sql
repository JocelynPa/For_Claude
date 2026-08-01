-- AlterTable
-- The app now only handles Sentry Mode — Dashboard/Stats/Paywall (and the
-- RevenueCat webhook that wrote this column) were removed entirely.
ALTER TABLE "User" DROP COLUMN "subscriptionStatus";
