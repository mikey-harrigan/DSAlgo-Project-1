import { useState } from 'react';
import { emails, formatEmailBody } from '../data/emails';
import { sendEmail, isEmailConfigured } from '../utils/emailService';

function Transmit({ onBack }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const [statusMessage, setStatusMessage] = useState('');

  const handleTransmit = async () => {
    if (!selectedEmail) return;

    if (!isEmailConfigured()) {
      setStatus('error');
      setStatusMessage('EmailJS not configured. See README for setup instructions.');
      setTimeout(() => {
        setStatus('idle');
        setStatusMessage('');
      }, 3000);
      return;
    }

    setStatus('sending');
    setStatusMessage('ESTABLISHING SECURE CHANNEL...');

    // Simulate transmission delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const email = emails.find(e => e.id === selectedEmail);
    const formattedBody = formatEmailBody(email.body);

    const result = await sendEmail(email.subject, formattedBody);

    if (result.success) {
      setStatus('success');
      setStatusMessage('TRANSMISSION COMPLETE ✓');
    } else {
      setStatus('error');
      setStatusMessage(result.message);
    }

    setTimeout(() => {
      setStatus('idle');
      setStatusMessage('');
      setSelectedEmail(null);
    }, 3000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-ops-cyan';
    }
  };

  return (
    <div className="min-h-screen bg-ops-black">
      {/* Header */}
      <header className="sticky top-0 bg-ops-black/95 backdrop-blur z-30 border-b border-ops-gray p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-ops-cyan hover:underline text-sm"
          >
            ← DASHBOARD
          </button>
          <h1 className="font-display text-lg text-white font-bold">TRANSMIT</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="p-4">
        {/* Console Header */}
        <div className="bg-ops-dark border border-ops-cyan/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs">SECURE CHANNEL ACTIVE</span>
          </div>
          <p className="text-gray-400 text-sm">
            Select intel package for transmission to designated recipient.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            RECIPIENT: jared.bluesteen@gmail.com
          </p>
        </div>

        {/* Email Selector */}
        <div className="mb-6">
          <label className="text-gray-400 text-xs mb-2 block">
            SELECT INTEL PACKAGE
          </label>
          <select
            value={selectedEmail || ''}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="w-full bg-ops-dark border border-ops-gray rounded-lg px-4 py-3
                       text-white focus:border-ops-cyan focus:outline-none
                       font-mono text-sm appearance-none cursor-pointer"
            disabled={status !== 'idle'}
          >
            <option value="">-- SELECT TRANSMISSION --</option>
            {emails.map(email => (
              <option key={email.id} value={email.id}>
                [{email.id}] {email.codename}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedEmail && (
          <div className="bg-ops-dark border border-ops-gray rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            <div className="text-xs text-ops-cyan mb-2">TRANSMISSION PREVIEW</div>
            <div className="text-gray-400 text-xs font-mono whitespace-pre-wrap">
              {emails.find(e => e.id === selectedEmail)?.body.substring(0, 500)}...
            </div>
          </div>
        )}

        {/* Status Display */}
        {statusMessage && (
          <div className={`text-center py-4 mb-4 ${getStatusColor()}`}>
            <p className="font-bold animate-pulse">{statusMessage}</p>
          </div>
        )}

        {/* Transmit Button */}
        <button
          onClick={handleTransmit}
          disabled={!selectedEmail || status !== 'idle'}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-200
                     ${selectedEmail && status === 'idle'
                       ? 'bg-ops-cyan text-ops-black hover:bg-ops-cyan/80 active:scale-95 glow-pulse'
                       : 'bg-ops-gray text-gray-500 cursor-not-allowed'
                     }`}
        >
          {status === 'sending' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-ops-black border-t-transparent rounded-full animate-spin" />
              TRANSMITTING...
            </span>
          ) : (
            '[ TRANSMIT ]'
          )}
        </button>

        {/* Configuration Notice */}
        {!isEmailConfigured() && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-yellow-400 text-sm font-bold mb-2">⚠️ CONFIGURATION REQUIRED</p>
            <p className="text-yellow-400/70 text-xs">
              EmailJS is not configured. To enable transmission:
            </p>
            <ol className="text-yellow-400/70 text-xs mt-2 list-decimal list-inside space-y-1">
              <li>Sign up at emailjs.com (free tier)</li>
              <li>Create an email service & template</li>
              <li>Update src/utils/emailService.js with your credentials</li>
            </ol>
          </div>
        )}

        {/* Transmission Log */}
        <div className="mt-6 bg-ops-dark border border-ops-gray rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">TRANSMISSION LOG</span>
            <span className="text-gray-600 text-xs">LAST 24H</span>
          </div>
          <div className="text-gray-600 text-xs font-mono space-y-1">
            <p>> 03:33:33 — Signal intercepted [REDACTED]</p>
            <p>> 11:11:11 — Packet delivered successfully</p>
            <p>> 17:17:17 — Awaiting confirmation...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transmit;
