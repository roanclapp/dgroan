import React, { useState, useEffect, useCallback } from 'react';
import { Client, DataSource } from '../types';
import { UserIcon, SpinnerIcon, RefreshIcon, NoShowIcon } from './IconComponents';
import { fetchNotionNoShowsForToday } from '../services/notion';
import { fetchAirtableNoShowsForToday } from '../services/airtable';

interface NoShowSelectorProps {
  onSelectClient: (client: Client, context?: string) => void;
}

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

const NoShowSelector: React.FC<NoShowSelectorProps> = ({ onSelectClient }) => {
  const [noShows, setNoShows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNoShows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const dataSource = localStorage.getItem('dataSource') as DataSource || 'notion';
        let fetchedNoShows: Client[] = [];

        if (dataSource === 'notion') {
            const apiKey = localStorage.getItem('notionApiKey');
            const dbId = localStorage.getItem('notionAppointmentDbId');
            const dateCol = localStorage.getItem('notionAppointmentDateColumn');
            const nameCol = localStorage.getItem('notionAppointmentNameColumn');
            const phoneCol = localStorage.getItem('notionAppointmentPhoneColumn');
            const hourCol = localStorage.getItem('notionAppointmentHourColumn') || '';
            const statusCol = localStorage.getItem('notionAppointmentStatusColumn');
            const noShowStatus = localStorage.getItem('notionAppointmentNoShowStatus');
            
            if (apiKey && dbId && dateCol && nameCol && phoneCol && statusCol && noShowStatus) {
                fetchedNoShows = await fetchNotionNoShowsForToday(apiKey, dbId, dateCol, nameCol, phoneCol, hourCol, statusCol, noShowStatus);
            } else {
                setLoading(false);
                setError("Configuration des rendez-vous manquante. Veuillez vérifier les réglages.");
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
            const statusCol = localStorage.getItem('airtableAppointmentStatusColumn');
            const noShowStatus = localStorage.getItem('airtableAppointmentNoShowStatus');
            
            if (pat && baseId && table && dateCol && nameCol && phoneCol && statusCol && noShowStatus) {
                fetchedNoShows = await fetchAirtableNoShowsForToday(pat, baseId, table, dateCol, nameCol, phoneCol, hourCol, statusCol, noShowStatus);
            } else {
                setLoading(false);
                setError("Configuration des rendez-vous manquante. Veuillez vérifier les réglages.");
                return;
            }
        }
        
        if (fetchedNoShows.length > 0) {
            fetchedNoShows.sort((a, b) => {
                if (!a.appointmentTime) return 1;
                if (!b.appointmentTime) return -1;
                const normalizeTime = (timeStr: string) => {
                    let [hour, minute] = timeStr.replace('h', ':').split(':');
                    hour = hour.trim().padStart(2, '0');
                    minute = (minute || '00').trim().padStart(2, '0');
                    return `${hour}:${minute}`;
                };
                return normalizeTime(a.appointmentTime).localeCompare(normalizeTime(b.appointmentTime));
            });
        }

        setNoShows(fetchedNoShows);
    } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors du chargement des clients absents.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNoShows();
  }, [fetchNoShows]);

  return (
    <div className="w-full max-w-2xl mx-auto">
       <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
            <div className="flex items-center gap-3">
                <NoShowIcon className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-800">Clients absents aujourd'hui</h2>
            </div>
            <button
                onClick={fetchNoShows}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[#8A003C] bg-[#FFCCE4]/50 rounded-full hover:bg-[#FFCCE4]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Rafraîchir les clients absents"
            >
                {loading ? (
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
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {loading && (
                <div className="flex items-center justify-center p-4 text-gray-500">
                    <SpinnerIcon className="w-5 h-5 mr-2" />
                    <span>Chargement...</span>
                </div>
            )}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && noShows.length === 0 && (
                <p className="text-center text-gray-500 pt-8 pb-4">Aucun client absent trouvé pour aujourd'hui.</p>
            )}
            {noShows.map(client => (
                <ClientListItem key={client.id} client={client} onSelect={(client) => onSelectClient(client, 'noShow')} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default NoShowSelector;
