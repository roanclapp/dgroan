import React, { useState } from 'react';
import { ArrowLeftIcon, ClipboardCopyIcon } from './IconComponents';

interface ComposerProps {
  phoneNumber: string;
  message: string;
  onPhoneNumberChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onBack: () => void;
}

const Composer: React.FC<ComposerProps> = ({
  phoneNumber,
  message,
  onPhoneNumberChange,
  onMessageChange,
  onBack,
}) => {
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const handleCopy = (text: string, type: 'phone' | 'message') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'phone') {
        setPhoneCopied(true);
        setTimeout(() => setPhoneCopied(false), 2000);
      } else {
        setMessageCopied(true);
        setTimeout(() => setMessageCopied(false), 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert("Erreur lors de la copie.");
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
       <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 transition mr-4"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Préparer l'envoi</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="relative">
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12"
            />
            <button
              onClick={() => handleCopy(phoneNumber, 'phone')}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 transition"
              aria-label="Copier le numéro"
            >
              {phoneCopied ? <span className="text-sm text-indigo-600 font-semibold">Copié!</span> : <ClipboardCopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
           <div className="relative">
            <textarea
              id="message"
              rows={8}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12"
            />
            <button
              onClick={() => handleCopy(message, 'message')}
              className="absolute top-2 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 transition"
              aria-label="Copier le message"
            >
              {messageCopied ? <span className="text-sm text-indigo-600 font-semibold">Copié!</span> : <ClipboardCopyIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;