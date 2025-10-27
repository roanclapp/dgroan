import React, { useState, useEffect } from 'react';
import { CloseIcon, NotionIcon, DocumentTextIcon, UserIcon, AirtableIcon } from './IconComponents';
import { DataSource } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConnect, onDisconnect }) => {
  const [dataSource, setDataSource] = useState<DataSource>('notion');
  
  // Notion State
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionClientDbId, setNotionClientDbId] = useState('');
  const [notionNameColumn, setNotionNameColumn] = useState('');
  const [notionPhoneColumn, setNotionPhoneColumn] = useState('');
  const [notionTemplateDbId, setNotionTemplateDbId] = useState('');
  const [notionTitleColumn, setNotionTitleColumn] = useState('');
  const [notionContentColumn, setNotionContentColumn] = useState('');

  // Airtable State
  const [airtablePat, setAirtablePat] = useState('');
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [airtableClientTable, setAirtableClientTable] = useState('');
  const [airtableClientName, setAirtableClientName] = useState('');
  const [airtableClientPhone, setAirtableClientPhone] = useState('');
  const [airtableTemplateTable, setAirtableTemplateTable] = useState('');
  const [airtableTemplateTitle, setAirtableTemplateTitle] = useState('');
  const [airtableTemplateContent, setAirtableTemplateContent] = useState('');

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedDataSource = localStorage.getItem('dataSource') as DataSource || 'notion';
      setDataSource(savedDataSource);

      // Load Notion settings
      const savedNotionKey = localStorage.getItem('notionApiKey');
      setNotionApiKey(savedNotionKey || 'ntn_S61914752096psu0xk5XYrFRxzQXZrmp264GP8MVRD26N9');
      setNotionClientDbId(localStorage.getItem('notionClientDbId') || '1391710a6a09815fbcebc89f9f503e75');
      setNotionNameColumn(localStorage.getItem('notionNameColumn') || 'Clients');
      setNotionPhoneColumn(localStorage.getItem('notionPhoneColumn') || 'Téléphone ☎️');
      setNotionTemplateDbId(localStorage.getItem('notionTemplateDbId') || '2981710a6a09807abb22dbc5c5f7a1a5');
      setNotionTitleColumn(localStorage.getItem('notionTitleColumn') || 'Titre');
      setNotionContentColumn(localStorage.getItem('notionContentColumn') || 'Contenu');

      // Load Airtable settings
      const savedAirtablePat = localStorage.getItem('airtablePat');
      setAirtablePat(savedAirtablePat || '');
      setAirtableBaseId(localStorage.getItem('airtableBaseId') || '');
      setAirtableClientTable(localStorage.getItem('airtableClientTable') || '');
      setAirtableClientName(localStorage.getItem('airtableClientName') || 'Name');
      setAirtableClientPhone(localStorage.getItem('airtableClientPhone') || 'Phone');
      setAirtableTemplateTable(localStorage.getItem('airtableTemplateTable') || '');
      setAirtableTemplateTitle(localStorage.getItem('airtableTemplateTitle') || 'Title');
      setAirtableTemplateContent(localStorage.getItem('airtableTemplateContent') || 'Content');
      
      setIsConnected(!!(savedDataSource === 'notion' ? savedNotionKey : savedAirtablePat));
    }
  }, [isOpen]);
  
  const handleConnect = () => {
    localStorage.setItem('dataSource', dataSource);
    let connectionValid = false;
    
    if (dataSource === 'notion') {
      if (!notionApiKey.trim() || !notionClientDbId.trim() || !notionNameColumn.trim() || !notionPhoneColumn.trim()) {
        alert("Veuillez remplir tous les champs requis pour la base de données clients Notion.");
        return;
      }
      localStorage.setItem('notionApiKey', notionApiKey);
      localStorage.setItem('notionClientDbId', notionClientDbId);
      localStorage.setItem('notionNameColumn', notionNameColumn);
      localStorage.setItem('notionPhoneColumn', notionPhoneColumn);
      localStorage.setItem('notionTemplateDbId', notionTemplateDbId);
      localStorage.setItem('notionTitleColumn', notionTitleColumn);
      localStorage.setItem('notionContentColumn', notionContentColumn);
      connectionValid = true;
    } else if (dataSource === 'airtable') {
        if (!airtablePat.trim() || !airtableBaseId.trim() || !airtableClientTable.trim() || !airtableClientName.trim() || !airtableClientPhone.trim()) {
            alert("Veuillez remplir tous les champs requis pour la table clients Airtable.");
            return;
        }
        localStorage.setItem('airtablePat', airtablePat);
        localStorage.setItem('airtableBaseId', airtableBaseId);
        localStorage.setItem('airtableClientTable', airtableClientTable);
        localStorage.setItem('airtableClientName', airtableClientName);
        localStorage.setItem('airtableClientPhone', airtableClientPhone);
        localStorage.setItem('airtableTemplateTable', airtableTemplateTable);
        localStorage.setItem('airtableTemplateTitle', airtableTemplateTitle);
        localStorage.setItem('airtableTemplateContent', airtableTemplateContent);
        connectionValid = true;
    }

    if(connectionValid) {
        setIsConnected(true);
        onConnect();
        onClose();
    }
  };

  const handleDisconnect = () => {
    if (dataSource === 'notion') {
      ['notionApiKey', 'notionClientDbId', 'notionNameColumn', 'notionPhoneColumn', 'notionTemplateDbId', 'notionTitleColumn', 'notionContentColumn'].forEach(key => localStorage.removeItem(key));
    } else if (dataSource === 'airtable') {
      ['airtablePat', 'airtableBaseId', 'airtableClientTable', 'airtableClientName', 'airtableClientPhone', 'airtableTemplateTable', 'airtableTemplateTitle', 'airtableTemplateContent'].forEach(key => localStorage.removeItem(key));
    }
    
    setIsConnected(false);
    onDisconnect();
    alert(`Déconnexion de ${dataSource === 'notion' ? 'Notion' : 'Airtable'} réussie.`);
  };


  if (!isOpen) return null;

  const getSourceButtonStyle = (source: DataSource) => {
    return dataSource === source
      ? 'bg-gray-800 text-white shadow'
      : 'bg-gray-200 text-gray-600 hover:bg-gray-300';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition" aria-label="Fermer">
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Réglages</h2>

        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Source de données</label>
            <div className="flex w-full bg-gray-200 rounded-lg p-1">
                <button onClick={() => setDataSource('notion')} className={`w-1/2 flex items-center justify-center space-x-2 py-2 rounded-md font-semibold transition ${getSourceButtonStyle('notion')}`}>
                    <NotionIcon className="w-5 h-5" />
                    <span>Notion</span>
                </button>
                <button onClick={() => setDataSource('airtable')} className={`w-1/2 flex items-center justify-center space-x-2 py-2 rounded-md font-semibold transition ${getSourceButtonStyle('airtable')}`}>
                    <AirtableIcon className="w-5 h-5" />
                    <span>Airtable</span>
                </button>
            </div>
        </div>

        <div className="space-y-6">
            {dataSource === 'notion' && (
              <>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">Clé d'API Notion (Internal Integration Token)</label>
                  <input type="password" id="apiKey" value={notionApiKey} onChange={e => setNotionApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C] bg-white text-gray-900 placeholder:text-gray-500" placeholder="secret_..."/>
                </div>
                {/* Notion Clients DB */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-4"><UserIcon className="w-5 h-5 mr-2 text-[#8A003C]" /><h3 className="text-lg font-semibold">Base de Données Clients</h3></div>
                    <div className="space-y-4">
                        <div><label htmlFor="clientDbId" className="block text-sm font-medium text-gray-700 mb-1">ID de la Base de Données</label><input type="text" id="clientDbId" value={notionClientDbId} onChange={e => setNotionClientDbId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="nameColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Nom'</label><input type="text" id="nameColumn" value={notionNameColumn} onChange={e => setNotionNameColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="phoneColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Téléphone'</label><input type="text" id="phoneColumn" value={notionPhoneColumn} onChange={e => setNotionPhoneColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                    </div>
                </div>
                {/* Notion Templates DB */}
                 <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-4"><DocumentTextIcon className="w-5 h-5 mr-2 text-teal-600" /><h3 className="text-lg font-semibold">Base de Données Modèles <span className="text-sm font-normal text-gray-500">(Optionnel)</span></h3></div>
                     <div className="space-y-4">
                        <div><label htmlFor="templateDbId" className="block text-sm font-medium text-gray-700 mb-1">ID de la Base de Données</label><input type="text" id="templateDbId" value={notionTemplateDbId} onChange={e => setNotionTemplateDbId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C] placeholder:text-gray-500" placeholder="Laisser vide pour utiliser les modèles par défaut" /></div>
                        <div><label htmlFor="titleColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Titre'</label><input type="text" id="titleColumn" value={notionTitleColumn} onChange={e => setNotionTitleColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="contentColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Contenu'</label><input type="text" id="contentColumn" value={notionContentColumn} onChange={e => setNotionContentColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                    </div>
                </div>
              </>
            )}
            {dataSource === 'airtable' && (
              <>
                 <div className="p-4 border rounded-lg bg-gray-50">
                  <label htmlFor="airtablePat" className="block text-sm font-medium text-gray-700 mb-1">Airtable Personal Access Token</label>
                  <input type="password" id="airtablePat" value={airtablePat} onChange={e => setAirtablePat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C] bg-white text-gray-900 placeholder:text-gray-500" placeholder="pat..."/>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                    <label htmlFor="airtableBaseId" className="block text-sm font-medium text-gray-700 mb-1">Airtable Base ID</label>
                    <input type="text" id="airtableBaseId" value={airtableBaseId} onChange={e => setAirtableBaseId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C] bg-white text-gray-900 placeholder:text-gray-500" placeholder="app..."/>
                </div>
                {/* Airtable Clients Table */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-4"><UserIcon className="w-5 h-5 mr-2 text-[#8A003C]" /><h3 className="text-lg font-semibold">Table Clients</h3></div>
                    <div className="space-y-4">
                        <div><label htmlFor="airtableClientTable" className="block text-sm font-medium text-gray-700 mb-1">Nom de la Table</label><input type="text" id="airtableClientTable" value={airtableClientTable} onChange={e => setAirtableClientTable(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="airtableClientName" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Nom'</label><input type="text" id="airtableClientName" value={airtableClientName} onChange={e => setAirtableClientName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="airtableClientPhone" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Téléphone'</label><input type="text" id="airtableClientPhone" value={airtableClientPhone} onChange={e => setAirtableClientPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                    </div>
                </div>
                 {/* Airtable Templates Table */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center mb-4"><DocumentTextIcon className="w-5 h-5 mr-2 text-teal-600" /><h3 className="text-lg font-semibold">Table Modèles <span className="text-sm font-normal text-gray-500">(Optionnel)</span></h3></div>
                    <div className="space-y-4">
                        <div><label htmlFor="airtableTemplateTable" className="block text-sm font-medium text-gray-700 mb-1">Nom de la Table</label><input type="text" id="airtableTemplateTable" value={airtableTemplateTable} onChange={e => setAirtableTemplateTable(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" placeholder="Laisser vide pour utiliser les modèles par défaut" /></div>
                        <div><label htmlFor="airtableTemplateTitle" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Titre'</label><input type="text" id="airtableTemplateTitle" value={airtableTemplateTitle} onChange={e => setAirtableTemplateTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                        <div><label htmlFor="airtableTemplateContent" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Contenu'</label><input type="text" id="airtableTemplateContent" value={airtableTemplateContent} onChange={e => setAirtableTemplateContent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#8A003C] focus:border-[#8A003C]" /></div>
                    </div>
                </div>
              </>
            )}
            
            <div className="flex items-center space-x-4 pt-2">
              <button onClick={handleConnect} className="w-full px-4 py-2.5 rounded-md font-semibold text-white bg-black hover:bg-gray-800 transition">{isConnected ? 'Mettre à jour' : 'Connecter'}</button>
              {isConnected && (<button onClick={handleDisconnect} className="w-full px-4 py-2.5 rounded-md font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition">Se déconnecter</button>)}
            </div>
             <p className="text-xs text-gray-400 text-center">Vos informations sont stockées localement dans votre navigateur.</p>
          </div>
      </div>
       <style>{`.animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; } @keyframes fadeInScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

export default SettingsModal;