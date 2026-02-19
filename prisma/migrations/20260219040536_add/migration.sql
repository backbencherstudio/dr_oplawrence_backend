-- CreateTable
CREATE TABLE "prayers" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "status" SMALLINT DEFAULT 1,

    CONSTRAINT "prayers_pkey" PRIMARY KEY ("id")
);
