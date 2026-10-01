import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { ChatPanel } from './components/chat/ChatPanel.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';

import { EventsPage } from './pages/EventsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { RsvpDashboardPage } from './pages/RsvpDashboardPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { InviteLandingPage } from './pages/InviteLandingPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000
    }
  }
});

export const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans">
              <Navbar
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
              />

              <main className="flex-1">
                <Routes>
                  {/* Public event discovery feed */}
                  <Route path="/" element={<EventsPage />} />

                  {/* Public auth pages */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Public invite link landing page */}
                  <Route path="/invite/:token" element={<InviteLandingPage />} />

                  {/* Protected user routes */}
                  <Route
                    path="/rsvps"
                    element={
                      <ProtectedRoute>
                        <RsvpDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Real-time Assistant Chat Panel */}
              <ChatPanel
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
