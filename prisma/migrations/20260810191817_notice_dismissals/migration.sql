-- CreateTable
CREATE TABLE "NoticeDismissal" (
    "key" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeDismissal_pkey" PRIMARY KEY ("key")
);
