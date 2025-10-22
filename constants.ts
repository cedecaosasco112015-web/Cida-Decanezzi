
import { Book, Audiobook, ExplainedBook } from './types';

export const BOOKS: Book[] = [
  { id: 'b1', type: 'book', title: 'A Arte da Guerra', author: 'Sun Tzu', genre: 'Estratégia', coverUrl: 'https://picsum.photos/seed/b1/400/600', description: 'Um tratado militar clássico sobre estratégia e tática.' },
  { id: 'b2', type: 'book', title: 'O Poder do Hábito', author: 'Charles Duhigg', genre: 'Autoajuda', coverUrl: 'https://picsum.photos/seed/b2/400/600', description: 'Explore a ciência por trás da formação e mudança de hábitos.' },
  { id: 'b3', type: 'book', title: 'Sapiens: Uma Breve História da Humanidade', author: 'Yuval Noah Harari', genre: 'História', coverUrl: 'https://picsum.photos/seed/b3/400/600', description: 'Uma visão abrangente da história da humanidade, desde a Idade da Pedra até a revolução tecnológica.' },
  { id: 'b4', type: 'book', title: '1984', author: 'George Orwell', genre: 'Ficção Distópica', coverUrl: 'https://picsum.photos/seed/b4/400/600', description: 'Um romance clássico que explora temas de totalitarismo, vigilância e manipulação da verdade.' },
];

export const AUDIOBOOKS: Audiobook[] = [
  { id: 'a1', type: 'audiobook', title: 'O Alquimista', author: 'Paulo Coelho', duration: '4h 22m', coverUrl: 'https://picsum.photos/seed/a1/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'a2', type: 'audiobook', title: 'Mindset: A Nova Psicologia do Sucesso', author: 'Carol S. Dweck', duration: '8h 5m', coverUrl: 'https://picsum.photos/seed/a2/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'a3', type: 'audiobook', title: 'Pai Rico, Pai Pobre', author: 'Robert T. Kiyosaki', duration: '6h 30m', coverUrl: 'https://picsum.photos/seed/a3/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export const EXPLAINED_BOOKS: ExplainedBook[] = [
  { id: 'e1', type: 'explained', title: 'Essencialismo em 10 Minutos', bookTitle: 'Essencialismo', category: 'Produtividade', duration: '10m', coverUrl: 'https://picsum.photos/seed/e1/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'e2', type: 'explained', title: 'Os 7 Hábitos Explicados', bookTitle: 'Os 7 Hábitos das Pessoas Altamente Eficazes', category: 'Desenvolvimento Pessoal', duration: '15m', coverUrl: 'https://picsum.photos/seed/e2/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'e3', type: 'explained', title: 'Decifrando Rápido e Devagar', bookTitle: 'Rápido e Devagar: Duas Formas de Pensar', category: 'Psicologia', duration: '12m', coverUrl: 'https://picsum.photos/seed/e3/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 'e4', type: 'explained', title: 'O Ponto da Virada: Resumo', bookTitle: 'O Ponto da Virada', category: 'Negócios', duration: '8m', coverUrl: 'https://picsum.photos/seed/e4/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
];

export const ALL_ITEMS: (Book | Audiobook | ExplainedBook)[] = [...BOOKS, ...AUDIOBOOKS, ...EXPLAINED_BOOKS];
