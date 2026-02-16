-- CreateTable
CREATE TABLE "bible_books" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "bible_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_chapters" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "number" INTEGER NOT NULL,
    "book_id" TEXT NOT NULL,

    CONSTRAINT "bible_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_verses" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,

    CONSTRAINT "bible_verses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_name_key" ON "bible_books"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bible_chapters_book_id_number_key" ON "bible_chapters"("book_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "bible_verses_chapter_id_number_key" ON "bible_verses"("chapter_id", "number");

-- AddForeignKey
ALTER TABLE "bible_chapters" ADD CONSTRAINT "bible_chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bible_verses" ADD CONSTRAINT "bible_verses_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "bible_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
