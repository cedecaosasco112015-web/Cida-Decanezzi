import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActiveTab, Book, Audiobook, ExplainedBook, LibraryItem } from './types';
import { BOOKS, AUDIOBOOKS, EXPLAINED_BOOKS, ALL_ITEMS } from './constants';
import { generateBookSummary } from './services/geminiService';
import { HomeIcon, BookOpenIcon, HeadphonesIcon, LightBulbIcon, UserIcon, PlayIcon, PauseIcon, HeartIcon, XMarkIcon, ArrowDownTrayIcon, TrashIcon } from './components/icons';

type AudioTrack = Audiobook | ExplainedBook;

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [offlineItems, setOfflineItems] = useState<Set<string>>(new Set());
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  useEffect(() => {
    // Register Service Worker for offline capabilities
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('Service Worker registered with scope:', registration.scope))
          .catch(error => console.log('Service Worker registration failed:', error));
      });
    }

    // Load state from local storage
    const savedFavorites = localStorage.getItem('emarkez-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    const savedOfflineItems = localStorage.getItem('emarkez-offline');
    if (savedOfflineItems) {
      setOfflineItems(new Set(JSON.parse(savedOfflineItems)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('emarkez-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);
  
  useEffect(() => {
    localStorage.setItem('emarkez-offline', JSON.stringify(Array.from(offlineItems)));
  }, [offlineItems]);


  const toggleFavorite = useCallback((item: LibraryItem) => {
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(item.id)) {
        newFavs.delete(item.id);
      } else {
        newFavs.add(item.id);
      }
      return newFavs;
    });
  }, []);

  const handleDownload = useCallback((item: LibraryItem) => {
    const url = 'audioUrl' in item ? item.audioUrl : null;
    if (!url) {
        alert('Downloads estão disponíveis apenas para audiolivros e livros explicados nesta demonstração.');
        return;
    }

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'DOWNLOAD',
            payload: { id: item.id, url }
        });
        setOfflineItems(prev => new Set(prev).add(item.id));
        alert(`"${item.title}" está sendo baixado para acesso offline.`);
    } else {
        alert('Não foi possível iniciar o download. O serviço de offline não está pronto.');
    }
  }, []);

  const handleDeleteOffline = useCallback((item: LibraryItem) => {
    const url = 'audioUrl' in item ? item.audioUrl : null;
    if (!url) return;

    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'DELETE',
            payload: { id: item.id, url }
        });
        setOfflineItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
        });
    }
  }, []);

  const commonScreenProps = {
    favorites,
    toggleFavorite,
    offlineItems,
    handleDownload,
    handleDeleteOffline,
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onSelectItem={handleSelectItem} {...commonScreenProps} />;
      case 'books':
        return <LibraryScreen items={BOOKS} title="Livros" onSelectItem={handleSelectItem} {...commonScreenProps} />;
      case 'audiobooks':
        return <LibraryScreen items={AUDIOBOOKS} title="Audiolivros" onSelectItem={handleSelectItem} {...commonScreenProps} />;
      case 'explained':
        return <LibraryScreen items={EXPLAINED_BOOKS} title="Livros Explicados" onSelectItem={handleSelectItem} {...commonScreenProps} />;
      case 'profile':
        return <ProfileScreen favorites={favorites} />;
      default:
        return <HomeScreen onSelectItem={handleSelectItem} {...commonScreenProps} />;
    }
  };

  const handleSelectItem = (item: LibraryItem) => {
    if (item.type === 'book') {
      setSelectedBook(item);
    } else {
      setCurrentTrack(item);
    }
  };

  return (
    <div className="bg-white min-h-screen font-body text-gray-800">
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow pb-28">
          <Header />
          {renderContent()}
        </main>

        {currentTrack && (
          <AudioPlayer
            track={currentTrack}
            onClose={() => setCurrentTrack(null)}
          />
        )}

        {selectedBook && (
            <BookDetailModal
                book={selectedBook}
                isFavorite={favorites.has(selectedBook.id)}
                toggleFavorite={() => toggleFavorite(selectedBook)}
                isOffline={offlineItems.has(selectedBook.id)}
                onDownload={() => handleDownload(selectedBook)}
                onDeleteOffline={() => handleDeleteOffline(selectedBook)}
                onClose={() => setSelectedBook(null)}
            />
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

// --- Header Component ---
const Header: React.FC = () => (
    <header className="sticky top-0 bg-[#1A237E]/95 backdrop-blur-sm z-10 p-4 shadow-md">
        <div className="container mx-auto flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-gold text-brand-blue flex items-center justify-center rounded-lg">
                <p className="font-bold text-2xl font-serif">E</p>
            </div>
            <h1 className="text-2xl font-bold text-white font-sans tracking-wide">EmarkezBooks</h1>
        </div>
    </header>
);

// --- BottomNav Component ---
interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Início' },
    { id: 'books', icon: BookOpenIcon, label: 'Livros' },
    { id: 'audiobooks', icon: HeadphonesIcon, label: 'Áudios' },
    { id: 'explained', icon: LightBulbIcon, label: 'Explicados' },
    { id: 'profile', icon: UserIcon, label: 'Perfil' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A237E] text-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="container mx-auto flex justify-around">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-colors duration-200 ${activeTab === item.id ? 'text-brand-gold' : 'text-gray-300 hover:text-white'}`}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// --- Screens ---
interface ScreenProps {
    onSelectItem: (item: LibraryItem) => void;
    favorites: Set<string>;
    toggleFavorite: (item: LibraryItem) => void;
    offlineItems: Set<string>;
    handleDownload: (item: LibraryItem) => void;
    handleDeleteOffline: (item: LibraryItem) => void;
}

const HomeScreen: React.FC<ScreenProps> = ({ onSelectItem, favorites, toggleFavorite, offlineItems, handleDownload, handleDeleteOffline }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = ALL_ITEMS.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const itemCardProps = { onSelect: onSelectItem, favorites, toggleFavorite, offlineItems, handleDownload, handleDeleteOffline };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Pesquisar por título, autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
            </div>

            {searchTerm ? (
                <div>
                     <h2 className="text-2xl font-bold font-sans text-brand-blue mb-4">Resultados da Pesquisa</h2>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredItems.map(item => (
                            <ItemCard key={item.id} item={item} {...itemCardProps} isFavorite={favorites.has(item.id)} isOffline={offlineItems.has(item.id)} />
                        ))}
                     </div>
                </div>
            ) : (
                <>
                    <SectionCarousel title="Destaques do Dia" items={ALL_ITEMS.slice(0, 5)} {...itemCardProps} />
                    <SectionCarousel title="Livros Explicados" items={EXPLAINED_BOOKS} {...itemCardProps} />
                    <SectionCarousel title="Audiolivros Populares" items={AUDIOBOOKS} {...itemCardProps} />
                </>
            )}
        </div>
    );
};

interface LibraryScreenProps extends Omit<ScreenProps, 'onSelectItem' | 'toggleFavorite'> {
    items: LibraryItem[];
    title: string;
    onSelectItem: (item: LibraryItem) => void;
    toggleFavorite: (item: LibraryItem) => void;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ items, title, onSelectItem, favorites, toggleFavorite, offlineItems, handleDownload, handleDeleteOffline }) => {
    const itemCardProps = { onSelect: onSelectItem, favorites, toggleFavorite, offlineItems, handleDownload, handleDeleteOffline };
    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold font-sans text-brand-blue mb-6">{title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                    <ItemCard key={item.id} item={item} {...itemCardProps} isFavorite={favorites.has(item.id)} isOffline={offlineItems.has(item.id)}/>
                ))}
            </div>
        </div>
    );
}

const ProfileScreen: React.FC<{ favorites: Set<string> }> = ({ favorites }) => {
    const favoritedItems = ALL_ITEMS.filter(item => favorites.has(item.id));
    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex items-center space-x-4">
                <img src="https://picsum.photos/seed/user/100/100" alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-brand-gold" />
                <div>
                    <h2 className="text-2xl font-bold">Usuário Emarkez</h2>
                    <p className="text-gray-600">usuario@emarkez.com</p>
                </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-brand-blue mb-4">Meus Favoritos ({favoritedItems.length})</h3>
                {favoritedItems.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {favoritedItems.map(item => (
                        <img key={item.id} src={item.coverUrl} alt={item.title} className="w-full aspect-[2/3] object-cover rounded-md shadow-sm" />
                    ))}
                </div>
                ) : <p className="text-gray-500">Você ainda não salvou nenhum item.</p>}
            </div>

            <div className="bg-brand-blue text-white p-6 rounded-xl text-center shadow-lg">
                <h3 className="text-2xl font-bold text-brand-gold">Torne-se Premium!</h3>
                <p className="mt-2 mb-4">Acesso ilimitado, leitura offline e sem anúncios.</p>
                <button className="bg-brand-gold text-brand-blue font-bold py-3 px-8 rounded-full hover:bg-amber-300 transition-transform hover:scale-105">
                    Assine por R$ 9,90/mês
                </button>
            </div>
        </div>
    );
};


// --- UI Components ---
interface SectionCarouselProps {
    title: string;
    items: LibraryItem[];
    onSelect: (item: LibraryItem) => void;
    favorites: Set<string>;
    toggleFavorite: (item: LibraryItem) => void;
    offlineItems: Set<string>;
    handleDownload: (item: LibraryItem) => void;
    handleDeleteOffline: (item: LibraryItem) => void;
}
const SectionCarousel: React.FC<SectionCarouselProps> = ({ title, items, onSelect, favorites, toggleFavorite, offlineItems, handleDownload, handleDeleteOffline }) => (
    <section>
        <h2 className="text-2xl font-bold font-sans text-brand-blue mb-4">{title}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
            {items.map(item => (
                <div key={item.id} className="flex-shrink-0 w-36 sm:w-40">
                    <ItemCard item={item} onSelect={onSelect} isFavorite={favorites.has(item.id)} toggleFavorite={() => toggleFavorite(item)} isOffline={offlineItems.has(item.id)} onDownload={() => handleDownload(item)} onDeleteOffline={() => handleDeleteOffline(item)} />
                </div>
            ))}
        </div>
    </section>
);

interface ItemCardProps {
    item: LibraryItem;
    onSelect: (item: LibraryItem) => void;
    isFavorite: boolean;
    toggleFavorite: () => void;
    isOffline: boolean;
    onDownload: () => void;
    onDeleteOffline: () => void;
}
const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect, isFavorite, toggleFavorite, isOffline, onDownload, onDeleteOffline }) => {
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div className="group cursor-pointer" onClick={() => onSelect(item)}>
            <div className="relative">
                <img src={item.coverUrl} alt={item.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform group-hover:scale-105" />
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <button onClick={(e) => handleActionClick(e, toggleFavorite)} className="bg-black/50 p-1.5 rounded-full text-white hover:text-red-500 transition-colors" aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                        <HeartIcon className="w-5 h-5" filled={isFavorite} />
                    </button>
                    {(item.type === 'audiobook' || item.type === 'explained') && (
                        isOffline ? (
                            <button onClick={(e) => handleActionClick(e, onDeleteOffline)} className="bg-black/50 p-1.5 rounded-full text-white hover:text-yellow-400 transition-colors" aria-label="Remover do modo offline">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={(e) => handleActionClick(e, onDownload)} className="bg-black/50 p-1.5 rounded-full text-white hover:text-green-400 transition-colors" aria-label="Baixar para ouvir offline">
                                <ArrowDownTrayIcon className="w-5 h-5" />
                            </button>
                        )
                    )}
                </div>
            </div>
            <h3 className="font-bold mt-2 truncate text-sm">{item.title}</h3>
            <p className="text-xs text-gray-600 truncate">{item.type === 'book' || item.type === 'audiobook' ? item.author : item.bookTitle}</p>
        </div>
    );
}

// --- Audio Player ---
interface AudioPlayerProps {
  track: AudioTrack;
  onClose: () => void;
}
const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onClose }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const speedOptions = [0.75, 1, 1.25, 1.5, 2, 3];

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        isPlaying ? audio.play() : audio.pause();
    }, [isPlaying]);
    
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.src = track.audioUrl;
            audio.playbackRate = playbackRate;
            audio.play().catch(e => console.error("Audio play failed", e));
            setIsPlaying(true);
        }
    }, [track]);

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio) {
            setProgress(audio.currentTime);
            if (!duration && audio.duration) setDuration(audio.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if(audio) {
            audio.currentTime = Number(e.target.value);
            setProgress(audio.currentTime);
        }
    };
    
    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSpeedChange = () => {
        const currentIndex = speedOptions.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        setPlaybackRate(speedOptions[nextIndex]);
    };


    return (
        <div className="fixed bottom-16 left-0 right-0 bg-[#1A237E] text-white p-3 shadow-lg z-20 animate-slide-up">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} />
            <div className="container mx-auto flex items-center gap-4">
                <img src={track.coverUrl} alt={track.title} className="w-12 h-12 rounded-md" />
                <div className="flex-grow">
                    <p className="font-bold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-gray-300 truncate">{track.type === 'audiobook' ? track.author : track.bookTitle}</p>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{formatTime(progress)}</span>
                        <input
                            type="range"
                            value={progress}
                            max={duration || 0}
                            onChange={handleSeek}
                            className="w-full h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                        />
                         <span className="text-xs">{formatTime(duration)}</span>
                    </div>

                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSpeedChange} 
                        className="text-white font-semibold text-xs w-12 text-center border border-gray-400 rounded-md py-1 transition-colors hover:bg-white/20"
                        aria-label={`Mudar velocidade de reprodução. Velocidade atual: ${playbackRate}x`}
                    >
                        {playbackRate}x
                    </button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="text-brand-gold p-2">
                        {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                    </button>
                    <button onClick={onClose} className="text-gray-300 p-2">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- Book Detail Modal ---
interface BookDetailModalProps {
    book: Book;
    isFavorite: boolean;
    toggleFavorite: () => void;
    isOffline: boolean;
    onDownload: () => void;
    onDeleteOffline: () => void;
    onClose: () => void;
}
const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, isFavorite, toggleFavorite, isOffline, onDownload, onDeleteOffline, onClose }) => {
    const [summary, setSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);

    const handleGenerateSummary = async () => {
        setIsLoadingSummary(true);
        const result = await generateBookSummary(book.title, book.author);
        setSummary(result);
        setIsLoadingSummary(false);
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 flex justify-between items-center border-b">
                    <h2 className="text-xl font-bold text-brand-blue">Detalhes do Livro</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="flex flex-col sm:flex-row gap-6">
                        <img src={book.coverUrl} alt={book.title} className="w-32 sm:w-40 mx-auto sm:mx-0 flex-shrink-0 aspect-[2/3] object-cover rounded-lg shadow-lg"/>
                        <div className="text-center sm:text-left">
                            <h3 className="text-2xl font-bold text-brand-blue">{book.title}</h3>
                            <p className="text-lg text-gray-700 mt-1">por {book.author}</p>
                            <p className="text-sm bg-gray-100 text-gray-600 inline-block px-2 py-1 rounded-full mt-2">{book.genre}</p>
                            <p className="text-gray-600 mt-4 text-sm">{book.description}</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button 
                            onClick={handleGenerateSummary} 
                            disabled={isLoadingSummary}
                            className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-800 transition disabled:bg-gray-400">
                           {isLoadingSummary ? 'Gerando...' : '💡 Gerar Resumo com IA'}
                        </button>
                        {summary && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-brand-blue mb-2">Resumo por Gemini</h4>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{summary}</p>
                            </div>
                        )}
                    </div>
                </div>

                 <div className="p-4 grid grid-cols-2 gap-4 border-t bg-gray-50 rounded-b-lg">
                    <button onClick={toggleFavorite} className="w-full flex items-center justify-center gap-2 border-2 border-brand-blue text-brand-blue font-bold py-2 px-4 rounded-lg hover:bg-brand-blue hover:text-white transition">
                        <HeartIcon className="w-5 h-5" filled={isFavorite} />
                        {isFavorite ? 'Favoritado' : 'Favoritar'}
                    </button>
                    <button onClick={isOffline ? onDeleteOffline : onDownload} className="w-full flex items-center justify-center gap-2 border-2 border-brand-blue text-brand-blue font-bold py-2 px-4 rounded-lg hover:bg-brand-blue hover:text-white transition">
                       {isOffline ?  <TrashIcon className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                       {isOffline ? 'Remover Offline' : 'Salvar Offline'}
                    </button>
                    <button onClick={() => alert('Função de leitura indisponível nesta demonstração.')} className="col-span-2 w-full bg-brand-gold text-brand-blue font-bold py-3 px-4 rounded-lg hover:bg-amber-300 transition">
                        Ler Agora
                    </button>
                </div>
            </div>
        </div>
    );
}