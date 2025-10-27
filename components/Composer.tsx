import React, { useState } from 'react';
import { ArrowLeftIcon, UserIcon, MessageIcon, ClipboardCopyIcon } from './IconComponents';
import { Client } from '../types';

interface ComposerProps {
  client: Client;
  message: string;
  onBack: () => void;
}

const Composer: React.FC<ComposerProps> = ({
  client,
  message,
  onBack,
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    const showSuccess = () => {
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showSuccess();
        } else {
          alert("La copie a échoué. Veuillez copier le texte manuellement.");
        }
      } catch (err) {
        alert("La copie a échoué. Veuillez copier le texte manuellement.");
      }
      document.body.removeChild(textArea);
    };

    if (!navigator.clipboard) {
      fallbackCopy();
      return;
    }
    navigator.clipboard.writeText(text).then(showSuccess).catch((err) => {
      console.warn('navigator.clipboard.writeText failed, trying fallback.', err);
      fallbackCopy();
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
       <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 transition mr-4"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Aperçu du message</h2>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
        <div>
          <div className="flex items-center mb-2">
            <UserIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Destinataire</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold text-gray-900">{client.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-600">{client.phone}</p>
               <button 
                onClick={() => handleCopy(client.phone, 'client-phone')} 
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Copier le numéro de téléphone"
              >
                {copiedItem === 'client-phone' ? (
                    <span className="text-xs text-[#8A003C] font-bold px-1">Copié!</span>
                ) : (
                    <ClipboardCopyIcon className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div>
           <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MessageIcon className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">Message</h3>
            </div>
             <button 
                onClick={() => handleCopy(message, 'message-content')} 
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Copier le message"
              >
                {copiedItem === 'message-content' ? (
                    <span className="text-xs text-[#8A003C] font-bold px-1">Copié!</span>
                ) : (
                    <ClipboardCopyIcon className="w-4 h-4 text-gray-500" />
                )}
              </button>
          </div>
           <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;