import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GamesPage } from './pages/GamesPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import toast, { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function handleActivityEvent(
  username: string,
  gameName: string,
  status: number,
  queryClient: ReturnType<typeof useQueryClient>,
  currentUsername: string | undefined,
) {
  queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
  if (username === currentUsername) return;

  let message = '';
  let icon = '🎮';
  switch (status) {
    case 0: message = `${username} ha añadido ${gameName} a su lista de pendientes`; icon = '📋'; break;
    case 1: message = `${username} está jugando a ${gameName}`; icon = '🎮'; break;
    case 2: message = `${username} ha completado ${gameName}`; icon = '✅'; break;
    case 3: message = `¡${username} ha conseguido el PLATINO en ${gameName}!`; icon = '🏆'; break;
    case 4: message = `${username} ha abandonado ${gameName}`; icon = '❌'; break;
    default: message = `${username} ha actualizado su progreso en ${gameName}`;
  }

  toast(message, {
    icon,
    duration: 4000,
    style: {
      background: '#0f172a',
      color: '#fff',
      border: '1px solid rgba(251, 191, 36, 0.2)',
      fontSize: '0.85rem',
      fontWeight: '500',
    },
  });
}

const DEMO_FAKE_EVENTS: { username: string; gameName: string; status: number }[] = [
  { username: 'trophy_queen', gameName: 'Sekiro: Shadows Die Twice',     status: 3 },
  { username: 'speedrun_dad', gameName: 'Celeste',                       status: 2 },
  { username: 'jrpg_addict',  gameName: 'Final Fantasy XVI',             status: 1 },
  { username: 'indie_lover',  gameName: 'Animal Well',                   status: 0 },
];

function AppContent() {
  const { user, isAuthenticated, isLoading, isDemo } = useAuth();
  const queryClient = useQueryClient();

  // Demo mode: simulate SignalR events instead of connecting
  useEffect(() => {
    if (!isAuthenticated || !isDemo) return;
    let i = 0;
    const handle = window.setInterval(() => {
      const ev = DEMO_FAKE_EVENTS[i % DEMO_FAKE_EVENTS.length];
      i++;
      const customEvent = new CustomEvent('demo-activity', { detail: ev });
      window.dispatchEvent(customEvent);
    }, 25_000);
    return () => window.clearInterval(handle);
  }, [isAuthenticated, isDemo]);

  useEffect(() => {
    if (!isAuthenticated || !isDemo) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ username: string; gameName: string; status: number }>).detail;
      handleActivityEvent(detail.username, detail.gameName, detail.status, queryClient, user?.username);
    };
    window.addEventListener('demo-activity', handler);
    return () => window.removeEventListener('demo-activity', handler);
  }, [isAuthenticated, isDemo, queryClient, user?.username]);

  useEffect(() => {
    if (!isAuthenticated || isDemo) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5147'}/hubs/social`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    connection.start().catch(err => {
      if (import.meta.env.DEV) {
        console.error('SignalR Error:', err);
      }
    });

    connection.on('ReceiveActivityUpdate', (username: string, gameName: string, status: number) => {
      handleActivityEvent(username, gameName, status, queryClient, user?.username);
    });

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, user?.username, queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={40} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/profile/:username" element={<ProfilePage />} />
      <Route path="/game/:id/:name" element={isAuthenticated ? <GameDetailsPage /> : <AuthPage />} />
      <Route path="*" element={isAuthenticated ? <GamesPage /> : <AuthPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#f59e0b', secondary: '#1e293b' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
            }}
          />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
