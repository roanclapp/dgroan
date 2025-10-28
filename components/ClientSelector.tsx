import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client, DataSource } from '../types';
import { UserIcon, SearchIcon, SpinnerIcon, CalendarIcon, RefreshIcon } from './IconComponents';
import { searchNotionClients, fetchNotionAppointmentsForTomorrow } from '../services/notion';
import { searchAirtableClients, fetchAirtableAppointmentsForTomorrow } from '../services/airtable';

interface ClientSelectorProps {
  onSelectClient: (client: Client, context?: string) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const [appointments, setAppointments] = useState<Client[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
        const dataSource = localStorage.getItem('dataSource') as DataSource || 'notion';
        let fetchedAppointments: Client[] = [];

        if (dataSource === 'notion') {
            const apiKey = localStorage.getItem('notionApiKey');
            const dbId = localStorage.getItem('notionAppointmentDbId');
            const dateCol = localStorage.getItem('notionAppointmentDateColumn');
            const nameCol = localStorage.getItem('notionAppointmentNameColumn');
            const phoneCol = localStorage.getItem('notionAppointmentPhoneColumn');
            const hourCol = localStorage.getItem('notionAppointmentHourColumn') || '';
            const petsCol = localStorage.getItem('notionAppointmentPetsColumn') || '';
            const smsSentCol = localStorage.getItem('notionAppointmentSmsSentColumn') || '';
            
            if (apiKey && dbId && dateCol && nameCol && phoneCol) {
                fetchedAppointments = await fetchNotionAppointmentsForTomorrow(apiKey, dbId, dateCol, nameCol, phoneCol, hourCol, petsCol, smsSentCol);
            } else {
                setAppointmentsLoading(false);
                return;
            }
        } else if (dataSource === 'airtable') {
            const pat = localStorage.getItem('airtablePat');
            const baseId = localStorage.getItem('airtableBaseId');
            const table = localStorage.getItem('airtableAppointmentTable');
            const dateCol = localStorage.getItem('airtableAppointmentDateColumn');
            const nameCol = localStorage.getItem('airtableAppointmentNameColumn');
            const phoneCol = localStorage.getItem('airtableAppointmentPhoneColumn');
            const hourCol = localStorage.getItem('airtableAppointmentHourColumn') || '';
            const petsCol = localStorage.getItem('airtableAppointmentPetsColumn') || '';
            const smsSentCol = localStorage.getItem('airtableAppointmentSmsSentColumn') || '';
            
            if (pat && baseId && table && dateCol && nameCol && phoneCol) {
                fetchedAppointments = await fetchAirtableAppointmentsForTomorrow(pat, baseId, table, dateCol, nameCol, phoneCol, hourCol, petsCol, smsSentCol);
            } else {
                setAppointmentsLoading(false);
                return;
            }
        }
        
        // Tri robuste des rendez-vous par heure
        if (fetchedAppointments.length > 0) {
            fetchedAppointments.sort((a, b) => {
                if (!a.appointmentTime) return 1; // Placer ceux sans heure à la fin
                if (!b.appointmentTime) return -1;
                
                // Normalise les chaînes de temps (ex: "9h", "9:30", "10h") en format HH:MM pour un tri fiable
                const normalizeTime = (timeStr: string) => {
                    let [hour, minute] = timeStr.replace('h', ':').split(':');
                    hour = hour.trim().padStart(2, '0');
                    minute = (minute || '00').trim().padStart(2, '0');
                    return `${hour}:${minute}`;
                };

                return normalizeTime(a.appointmentTime).localeCompare(normalizeTime(b.appointmentTime));
            });
        }

        setAppointments(fetchedAppointments);
    } catch (e) {
        setAppointmentsError(e instanceof Error ? e.message : "Erreur lors du chargement des RDV.");
    } finally {
        setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


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
  
  const ClientListItem = ({ client, onSelect }: { client: Client; onSelect: (client: Client) => void; }) => (
      <div
        onClick={() => onSelect(client)}
        className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-[#8A003C] hover:shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1"
      >
        <div className="p-3 bg-[#8A003C] rounded-full mr-4">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-lg text-gray-800">{client.name}</p>
            {client.appointmentTime && (
                <span className="px-3 py-1 text-sm font-semibold text-white bg-[#8A003C] rounded-full">
                    {client.appointmentTime}
                </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">{client.phone}</p>
        </div>
      </div>
  );

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

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 mb-8">
        {error && <p className="text-center text-red-500">{error}</p>}
        {!error && !loading && searchTerm.length < 2 && (
            <p className="text-center text-gray-500 pt-8">Commencez à taper pour rechercher un client.</p>
        )}
        {!error && !loading && results.length === 0 && searchTerm.length >= 2 && (
            <p className="text-center text-gray-500 pt-8">Aucun client trouvé pour "{searchTerm}".</p>
        )}
        {results.map(client => (
            <ClientListItem key={client.id} client={client} onSelect={(client) => onSelectClient(client)} />
        ))}
      </div>
      
       <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
            <div className="flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-800">Confirmer les RDV de demain</h2>
            </div>
            <button
                onClick={fetchAppointments}
                disabled={appointmentsLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[#8A003C] bg-[#FFCCE4]/50 rounded-full hover:bg-[#FFCCE4]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Rafraîchir les rendez-vous"
            >
                {appointmentsLoading ? (
                    <>
                        <SpinnerIcon className="w-4 h-4" />
                        <span>Mise à jour...</span>
                    </>
                ) : (
                    <>
                        <RefreshIcon className="w-4 h-4" />
                        <span>Rafraîchir</span>
                    </>
                )}
            </button>
        </div>
        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
            {appointmentsLoading && (
            <div className="flex items-center justify-center p-4 text-gray-500">
                <SpinnerIcon className="w-5 h-5 mr-2" />
                <span>Chargement des rendez-vous...</span>
            </div>
            )}
            {appointmentsError && <p className="text-center text-red-500">{appointmentsError}</p>}
            {!appointmentsLoading && !appointmentsError && appointments.length === 0 && (
            <p className="text-center text-gray-500 pt-4 pb-4">Aucun rendez-vous trouvé.</p>
            )}
            {appointments.map(client => (
                <ClientListItem key={client.id} client={client} onSelect={(client) => onSelectClient(client, 'appointmentConfirmation')} />
            ))}
        </div>
      </div>

    </div>
  );
};

export default ClientSelector;