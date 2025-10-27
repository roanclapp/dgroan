import React, { useState, useEffect, useRef } from 'react';
import { Client, DataSource } from '../types';
import { UserIcon, SearchIcon, SpinnerIcon } from './IconComponents';
import { searchNotionClients } from '../services/notion';
import { searchAirtableClients } from '../services/airtable';

interface ClientSelectorProps {
  onSelectClient: (client: Client) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchTerm.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceTimeoutRef.current = window.setTimeout(async () => {
      try {
        const dataSource = localStorage.getItem('dataSource') as DataSource || 'notion';
        let clients: Client[] = [];
        
        if (dataSource === 'notion') {
          const savedApiKey = localStorage.getItem('notionApiKey');
          const savedClientDbId = localStorage.getItem('notionClientDbId');
          const savedNameColumn = localStorage.getItem('notionNameColumn');
          const savedPhoneColumn = localStorage.getItem('notionPhoneColumn');

          if (!savedApiKey || !savedClientDbId || !savedNameColumn || !savedPhoneColumn) {
            throw new Error("Configuration Notion manquante. Veuillez vérifier les réglages.");
          }
          clients = await searchNotionClients(savedApiKey, savedClientDbId, savedNameColumn, savedPhoneColumn, searchTerm);
        
        } else if (dataSource === 'airtable') {
            const savedPat = localStorage.getItem('airtablePat');
            const savedBaseId = localStorage.getItem('airtableBaseId');
            const savedClientTable = localStorage.getItem('airtableClientTable');
            const savedClientName = localStorage.getItem('airtableClientName');
            const savedClientPhone = localStorage.getItem('airtableClientPhone');

            if (!savedPat || !savedBaseId || !savedClientTable || !savedClientName || !savedClientPhone) {
                throw new Error("Configuration Airtable manquante. Veuillez vérifier les réglages.");
            }
            clients = await searchAirtableClients(savedPat, savedBaseId, savedClientTable, savedClientName, savedClientPhone, searchTerm);
        }

        setResults(clients);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue lors de la recherche.");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, [searchTerm]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C] transition bg-white text-gray-900 placeholder:text-gray-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? <SpinnerIcon className="w-5 h-5 text-gray-400" /> : <SearchIcon className="text-gray-400" />}
        </div>
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {error && <p className="text-center text-red-500">{error}</p>}
        {!error && !loading && searchTerm.length < 2 && (
            <p className="text-center text-gray-500 pt-8">Commencez à taper pour rechercher un client.</p>
        )}
        {!error && !loading && results.length === 0 && searchTerm.length >= 2 && (
            <p className="text-center text-gray-500 pt-8">Aucun client trouvé pour "{searchTerm}".</p>
        )}
        {results.map(client => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-[#8A003C] hover:shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="p-3 bg-[#8A003C] rounded-full mr-4">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">{client.name}</p>
              <p className="text-gray-500">{client.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientSelector;