import React from 'react';
import { ArrowLeftIcon, UserIcon, MessageIcon } from './IconComponents';
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
            <p className="text-gray-600">{client.phone}</p>
          </div>
        </div>
        <div>
           <div className="flex items-center mb-2">
            <MessageIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Message</h3>
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
