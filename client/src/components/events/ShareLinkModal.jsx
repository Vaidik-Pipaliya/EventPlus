import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';
import { apiClient } from '../../api/client.js';

export const ShareLinkModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle
}) => {
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !eventId) return;

    const fetchOrCreateLink = async () => {
      try {
        setLoading(true);
        // 1. Get or generate share link
        const res = await apiClient.post(`/api/share/${eventId}`);
        const data = res.data.data;

        // 2. Fetch latest stats
        const statsRes = await apiClient.get(`/api/share/${eventId}/stats`).catch(() => null);
        const uniqueClicks = statsRes?.data?.data?.uniqueClicks || 0;

        setShareData({
          ...data,
          uniqueClicks
        });
      } catch (err) {
        showToast(err.response?.data?.error?.message || 'Could not generate share link', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateLink();
  }, [isOpen, eventId]);

  const handleCopy = () => {
    if (!shareData?.shareUrl) return;
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Invite Friends ("Vibe Check")'
    >
      {loading ? (
        <div className="py-6 flex items-center justify-center text-xs text-app-text-muted">
          <span>Generating unique invite link...</span>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <p className="text-xs text-app-text-muted leading-relaxed">
            Share this link with friends for <strong className="text-app-text">{eventTitle}</strong>. When they open it, their attendance will be reflected on your event card!
          </p>

          {/* Copy input row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareData?.shareUrl || ''}
              className="flex-1 h-10 px-3 text-xs font-mono bg-app-surface-muted border border-app-border rounded-input text-app-text select-all focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          {/* Live Visitor Stat */}
          <div className="p-3 bg-app-surface-muted rounded-input flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-app-text">
              <Users className="w-4 h-4 text-app-primary shrink-0" />
              <span>
                <strong>{shareData?.uniqueClicks || 0}</strong> {shareData?.uniqueClicks === 1 ? 'person has' : 'people have'} opened this link
              </span>
            </div>
            <a
              href={shareData?.shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-app-primary hover:underline text-[11px]"
            >
              Preview <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
};
