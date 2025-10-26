import React from 'react';
import { ArrowLeftIcon } from './IconComponents';

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
  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
       <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 transition mr-4"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Vérifiez les informations</h2>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;