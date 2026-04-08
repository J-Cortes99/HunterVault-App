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

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

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
      // Global refresh for the feed
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      
      // Show notification only for other users
      if (username !== user?.username) {
        let message = '';
        let icon = '🎮';

        switch (status) {
          case 0: // Backlog
            message = `${username} ha añadido ${gameName} a su lista de pendientes`;
            icon = '📋';
            break;
          case 1: // Playing
            message = `${username} está jugando a ${gameName}`;
            icon = '🎮';
            break;
          case 2: // Completed
            message = `${username} ha completado ${gameName}`;
            icon = '✅';
            break;
          case 3: // Platinumed
            message = `¡${username} ha conseguido el PLATINO en ${gameName}!`;
            icon = '🏆';
            break;
          case 4: // Dropped
            message = `${username} ha abandonado ${gameName}`;
            icon = '❌';
            break;
          default:
            message = `${username} ha actualizado su progreso en ${gameName}`;
        }

        toast(message, {
          icon,
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }
        });
      }
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
