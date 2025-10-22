
export interface Book {
  id: string;
  type: 'book';
  title: string;
  author: string;
  genre: string;
  coverUrl: string;
  description: string;
}

export interface Audiobook {
  id: string;
  type: 'audiobook';
  title: string;
  author: string;
  duration: string; // e.g., "3h 45m"
  coverUrl: string;
  audioUrl: string;
}

export interface ExplainedBook {
  id: string;
  type: 'explained';
  title: string;
  bookTitle: string;
  category: string;
  duration: string; // e.g., "10m"
  coverUrl: string;
  audioUrl: string;
}

export type LibraryItem = Book | Audiobook | ExplainedBook;

export type ActiveTab = 'home' | 'books' | 'audiobooks' | 'explained' | 'profile';
