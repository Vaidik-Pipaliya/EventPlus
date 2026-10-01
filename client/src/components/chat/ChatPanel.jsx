import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, X, Bot, Calendar, MapPin, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { apiClient } from '../../api/client.js';

export const ChatPanel = ({ isOpen, onClose }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi, I'm your EventPulse Assistant. Ask me about events happening this weekend, in your city, or check your confirmed RSVPs."
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Connect socket
  useEffect(() => {
    if (!token || !isOpen) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', () => {
      setConnected(false);
    });

    newSocket.on('chat:typing', (data) => {
      setIsTyping(Boolean(data?.isTyping));
    });

    newSocket.on('chat:reply', (data) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `reply_${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          events: data.events || []
        }
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, isOpen]);

  const handleSend = (textToSend = input) => {
    const text = textToSend.trim();
    if (!text) return;

    if (!socket || !connected) {
      setMessages((prev) => [
        ...prev,
        { id: `user_${Date.now()}`, sender: 'user', text },
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Connecting to chat gateway... Please make sure you are signed in and server is running.'
        }
      ]);
      setInput('');
      return;
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, sender: 'user', text }
    ]);
    setInput('');

    // Emit to server
    socket.emit('chat:message', { text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Inline RSVP from chat
  const handleInlineRsvp = async (eventId) => {
    try {
      await apiClient.post('/api/rsvps', { eventId });
      // Update UI state
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          events: msg.events?.map((ev) =>
            ev.id === eventId ? { ...ev, rsvped: true } : ev
          )
        }))
      );
    } catch (err) {
      console.error('RSVP failed from chat:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-app-surface border-l border-app-border flex flex-col shadow-modal animate-in slide-in-from-right duration-200"
      aria-label="Assistant Chat"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-app-border flex items-center justify-between bg-app-surface shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-input bg-app-surface-muted flex items-center justify-center text-app-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-app-text leading-tight">
              Assistant
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-app-text-muted">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{connected ? 'Realtime Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-input text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-[10px] text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-app-primary text-white rounded-br-sm'
                    : 'bg-app-surface-muted text-app-text border border-app-border/40 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* Compact Event Cards attached to message */}
              {msg.events && msg.events.length > 0 && (
                <div className="w-full mt-2 space-y-2 max-w-[92%]">
                  {msg.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-app-surface border border-app-border rounded-input flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-app-text truncate">
                          {ev.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-app-text-muted mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {ev.date}
                          </span>
                          {ev.venue && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {ev.venue}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick RSVP toggle in chat */}
                      {ev.rsvped ? (
                        <span className="shrink-0 text-[11px] font-medium text-app-success flex items-center gap-0.5 px-2 py-1 bg-app-success-soft rounded-input">
                          <Check className="w-3 h-3 stroke-[2.5]" /> Going
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInlineRsvp(ev.id)}
                          className="shrink-0 text-[11px] font-medium text-app-primary hover:text-white hover:bg-app-primary border border-app-primary px-2 py-1 rounded-input transition-colors"
                        >
                          RSVP
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-1 px-3 py-2 bg-app-surface-muted rounded-card w-14 text-app-text-muted">
            <span className="w-1.5 h-1.5 bg-app-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-app-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-app-text-muted rounded-full animate-bounce" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 border-t border-app-border/40 bg-app-surface flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => handleSend('events this weekend')}
          className="shrink-0 px-2.5 py-1 rounded-input border border-app-border hover:border-app-primary hover:text-app-primary text-app-text-muted transition-colors"
        >
          Events this weekend
        </button>
        <button
          onClick={() => handleSend('show my RSVPs')}
          className="shrink-0 px-2.5 py-1 rounded-input border border-app-border hover:border-app-primary hover:text-app-primary text-app-text-muted transition-colors"
        >
          Show my RSVPs
        </button>
        <button
          onClick={() => handleSend('help')}
          className="shrink-0 px-2.5 py-1 rounded-input border border-app-border hover:border-app-primary hover:text-app-primary text-app-text-muted transition-colors"
        >
          Help
        </button>
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-app-border bg-app-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAuthenticated
                ? "Ask about events, dates, or RSVPs..."
                : "Sign in to chat with Assistant"
            }
            disabled={!isAuthenticated}
            className="flex-1 h-9 px-3 text-xs bg-app-surface-muted border border-app-border rounded-input text-app-text placeholder:text-app-text-muted/70 focus:outline-none focus:border-app-primary focus:bg-app-surface transition-colors"
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || !isAuthenticated}
            className="h-9 w-9 p-0 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </aside>
  );
};
