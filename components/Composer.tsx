import React, { useState } from 'react';
import { ArrowLeftIcon, UserIcon, MessageIcon, ClipboardCopyIcon, PetIcon, SpinnerIcon } from './IconComponents';
import { Client, DataSource } from '../types';
import { updateNotionCheckbox } from '../services/notion';
import { updateAirtableCheckbox } from '../services/airtable';

interface ComposerProps {
  client: Client;
  message: string;
  onBack: () => void;
  context: string | null;
}

const Composer: React.FC<ComposerProps> = ({
  client,
  message,
  onBack,
  context,
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isSmsSent, setIsSmsSent] = useState(client.smsSent || false);
  const [isNoShowSmsSent, setIsNoShowSmsSent] = useState(client.noShowSmsSent || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);


  const handleCopy = (text: string, id: string) => {
    // ... (copy logic remains the same)
  };

  const handleSmsSentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = event.target.checked;
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
        const dataSource = localStorage.getItem('dataSource') as DataSource;

        if (dataSource === 'notion') {
            const apiKey = localStorage.getItem('notionApiKey');
            const smsSentColumn = localStorage.getItem('notionAppointmentSmsSentColumn');
            if (!apiKey || !smsSentColumn) {
                throw new Error("Configuration Notion pour 'SMS envoyé' manquante.");
            }
            await updateNotionCheckbox(apiKey, client.id, smsSentColumn, newCheckedState);
        } else if (dataSource === 'airtable') {
            const pat = localStorage.getItem('airtablePat');
            const baseId = localStorage.getItem('airtableBaseId');
            const table = localStorage.getItem('airtableAppointmentTable');
            const smsSentColumn = localStorage.getItem('airtableAppointmentSmsSentColumn');
             if (!pat || !baseId || !table || !smsSentColumn) {
                throw new Error("Configuration Airtable pour 'SMS envoyé' manquante.");
            }
            await updateAirtableCheckbox(pat, baseId, table, client.id, smsSentColumn, newCheckedState);
        }

        setIsSmsSent(newCheckedState);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        setUpdateError(errorMessage);
        alert(`Erreur de mise à jour: ${errorMessage}`);
    } finally {
        setIsUpdating(false);
    }
  };
  
  const handleNoShowSmsSentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = event.target.checked;
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
        const dataSource = localStorage.getItem('dataSource') as DataSource;

        if (dataSource === 'notion') {
            const apiKey = localStorage.getItem('notionApiKey');
            const noShowSmsSentColumn = localStorage.getItem('notionAppointmentNoShowSmsSentColumn');
            if (!apiKey || !noShowSmsSentColumn) {
                throw new Error("Configuration Notion pour 'SMS pas venu envoyé' manquante.");
            }
            await updateNotionCheckbox(apiKey, client.id, noShowSmsSentColumn, newCheckedState);
        } else if (dataSource === 'airtable') {
            const pat = localStorage.getItem('airtablePat');
            const baseId = localStorage.getItem('airtableBaseId');
            const table = localStorage.getItem('airtableAppointmentTable');
            const noShowSmsSentColumn = localStorage.getItem('airtableAppointmentNoShowSmsSentColumn');
             if (!pat || !baseId || !table || !noShowSmsSentColumn) {
                throw new Error("Configuration Airtable pour 'SMS pas venu envoyé' manquante.");
            }
            await updateAirtableCheckbox(pat, baseId, table, client.id, noShowSmsSentColumn, newCheckedState);
        }

        setIsNoShowSmsSent(newCheckedState);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        setUpdateError(errorMessage);
        alert(`Erreur de mise à jour: ${errorMessage}`);
    } finally {
        setIsUpdating(false);
    }
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
            {client.appointmentTime && (
              <span className="ml-auto px-3 py-1 text-xs font-semibold text-white bg-[#8A003C] rounded-full">
                {client.appointmentTime}
              </span>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="font-semibold text-gray-900">{client.name}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-gray-600">{client.phone}</p>
              {context === null && (
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
              )}
            </div>
          </div>
        </div>

        {context === 'appointmentConfirmation' ? (
          client.pets ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <PetIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700">Animaux</h3>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-gray-800 whitespace-pre-wrap">{client.pets}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                Aucune information sur les animaux pour ce client.
            </div>
          )
        ) : context === 'noShow' ? (
           <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <MessageIcon className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Message</h3>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-gray-800 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        ) : (
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
        )}

        {context === 'appointmentConfirmation' && (
            <div className="pt-4 border-t border-gray-200">
                <label htmlFor="sms-sent-checkbox" className={`flex items-center justify-between ${isUpdating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <span className="flex items-center gap-2 font-semibold text-gray-700">
                        SMS Envoyé
                        {isUpdating && <SpinnerIcon className="w-4 h-4" />}
                    </span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="sms-sent-checkbox"
                            className="sr-only"
                            checked={isSmsSent}
                            onChange={handleSmsSentChange}
                            disabled={isUpdating}
                        />
                        <div className={`w-12 h-6 rounded-full shadow-inner transition-colors ${isSmsSent ? 'bg-[#8A003C]' : 'bg-gray-300'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${isSmsSent ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
                {updateError && <p className="text-sm text-red-500 mt-2 text-right">{updateError}</p>}
            </div>
        )}
        
        {context === 'noShow' && (
            <div className="pt-4 border-t border-gray-200">
                <label htmlFor="no-show-sms-sent-checkbox" className={`flex items-center justify-between ${isUpdating ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <span className="flex items-center gap-2 font-semibold text-gray-700">
                        SMS 'Pas Venu' Envoyé
                        {isUpdating && <SpinnerIcon className="w-4 h-4" />}
                    </span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="no-show-sms-sent-checkbox"
                            className="sr-only"
                            checked={isNoShowSmsSent}
                            onChange={handleNoShowSmsSentChange}
                            disabled={isUpdating}
                        />
                        <div className={`w-12 h-6 rounded-full shadow-inner transition-colors ${isNoShowSmsSent ? 'bg-[#8A003C]' : 'bg-gray-300'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${isNoShowSmsSent ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
                {updateError && <p className="text-sm text-red-500 mt-2 text-right">{updateError}</p>}
            </div>
        )}
      </div>
    </div>
  );
};

export default Composer;