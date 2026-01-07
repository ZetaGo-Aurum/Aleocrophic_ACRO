'use client';

import { useEffect, useState } from 'react';

interface InvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    tierName: string;
    price: number;
    transactionId: string;
    licenseKey: string;
    date: string;
    newBalance: number;
  } | null;
}

export default function InvoiceCard({ isOpen, onClose, data }: InvoiceProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const copyLicense = () => {
    navigator.clipboard.writeText(data.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Invoice Card */}
      <div className="relative w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9c4dcc] to-[#6a1b9a] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
          <div className="relative z-10 font-bold text-2xl tracking-wide">
            PAYMENT SUCCESSFUL
          </div>
          <div className="relative z-10 text-white/80 text-sm mt-1">
            Thank you for your purchase
          </div>
          <div className="absolute top-4 right-4 text-4xl opacity-20">✓</div>
        </div>

        {/* content */}
        <div className="p-6 space-y-6">
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Item Purchased</div>
            <div className="text-xl font-bold bg-gradient-to-r from-[#d17fff] to-[#ffd54f] bg-clip-text text-transparent">
              {data.tierName}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Transaction ID</span>
              <span className="font-mono text-xs text-gray-300 bg-white/5 px-2 py-1 rounded">
                {data.transactionId}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Date</span>
              <span className="text-gray-300">
                {new Date(data.date).toLocaleDateString()} {new Date(data.date).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Amount Paid</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#ffd54f]">{data.price} ACRON</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Remaining Balance</span>
              <span className="text-gray-300">{data.newBalance} ACRON</span>
            </div>
          </div>

          {/* License Key Section */}
          <div className="bg-[#0f0f1a] p-4 rounded-xl border border-dashed border-white/10 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Your License Key</div>
            <div className="font-mono text-[#d17fff] text-lg font-bold break-all mb-3 select-all">
              {data.licenseKey}
            </div>
            <button 
              onClick={copyLicense}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                copied 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {copied ? '✓ Copied to Clipboard' : '📋 Copy License Key'}
            </button>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#9c4dcc] to-[#6a1b9a] hover:opacity-90 transition-opacity rounded-xl font-bold text-white shadow-lg shadow-purple-500/20"
          >
            Close Receipt
          </button>

        </div>
      </div>
    </div>
  );
}
