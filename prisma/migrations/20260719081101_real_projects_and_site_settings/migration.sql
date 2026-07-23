-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "client" TEXT,
ADD COLUMN     "collaborator" TEXT,
ADD COLUMN     "photographer" TEXT,
ADD COLUMN     "siteArea" TEXT,
ADD COLUMN     "statusNote" TEXT,
ADD COLUMN     "units" TEXT;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
