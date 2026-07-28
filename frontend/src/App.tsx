import { AppLayout } from "./components/AppLayout";
import { BookDetailPage } from "./features/books/BookDetailPage";
import { BooksPage } from "./features/books/BooksPage";
import { usePathname } from "./routing";

export function App() {
  const pathname = usePathname();
  const bookMatch = /^\/books\/([0-9a-f-]+)$/i.exec(pathname);

  return (
    <AppLayout>
      {bookMatch === null ? <BooksPage /> : <BookDetailPage bookId={bookMatch[1]} />}
    </AppLayout>
  );
}
