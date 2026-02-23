-- CreateTable
CREATE TABLE "bible_verse_notes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "verse_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "bible_verse_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bible_verse_notes_user_id_verse_id_key" ON "bible_verse_notes"("user_id", "verse_id");

-- AddForeignKey
ALTER TABLE "bible_verse_notes" ADD CONSTRAINT "bible_verse_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verse_notes" ADD CONSTRAINT "bible_verse_notes_verse_id_fkey" FOREIGN KEY ("verse_id") REFERENCES "bible_verses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
