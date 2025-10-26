import React, { useState, useEffect } from 'react';
import { CloseIcon, NotionIcon, DocumentTextIcon, UserIcon } from './IconComponents';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConnect, onDisconnect }) => {
  const [apiKey, setApiKey] = useState('');
  // Clients
  const [clientDbId, setClientDbId] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  const [phoneColumn, setPhoneColumn] = useState('');
  // Templates
  const [templateDbId, setTemplateDbId] = useState('');
  const [titleColumn, setTitleColumn] = useState('');
  const [contentColumn, setContentColumn] = useState('');
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedApiKey = localStorage.getItem('notionApiKey');
      const savedClientDbId = localStorage.getItem('notionClientDbId');
      
      if (savedApiKey && savedClientDbId) {
        setApiKey(savedApiKey);
        setClientDbId(savedClientDbId);
        setNameColumn(localStorage.getItem('notionNameColumn') || 'Clients');
        setPhoneColumn(localStorage.getItem('notionPhoneColumn') || 'Téléphone ☎️');
        setTemplateDbId(localStorage.getItem('notionTemplateDbId') || '2981710a6a09807abb22dbc5c5f7a1a5');
        setTitleColumn(localStorage.getItem('notionTitleColumn') || 'Titre');
        setContentColumn(localStorage.getItem('notionContentColumn') || 'Contenu');
        setIsConnected(true);
      } else {
        setIsConnected(false);
        setApiKey('ntn_S61914752096psu0xk5XYrFRxzQXZrmp264GP8MVRD26N9');
        setClientDbId('1391710a6a09815fbcebc89f9f503e75');
        setNameColumn('Clients');
        setPhoneColumn('Téléphone ☎️');
        setTemplateDbId('2981710a6a09807abb22dbc5c5f7a1a5');
        setTitleColumn('Titre');
        setContentColumn('Contenu');
      }
    }
  }, [isOpen]);
  
  const handleConnect = () => {
    if (!apiKey.trim() || !clientDbId.trim() || !nameColumn.trim() || !phoneColumn.trim()) {
      alert("Veuillez remplir au moins les champs pour la base de données des clients.");
      return;
    }
    localStorage.setItem('notionApiKey', apiKey);
    localStorage.setItem('notionClientDbId', clientDbId);
    localStorage.setItem('notionNameColumn', nameColumn);
    localStorage.setItem('notionPhoneColumn', phoneColumn);
    
    if (templateDbId.trim()) {
      localStorage.setItem('notionTemplateDbId', templateDbId);
      localStorage.setItem('notionTitleColumn', titleColumn);
      localStorage.setItem('notionContentColumn', contentColumn);
    }

    setIsConnected(true);
    onConnect();
    onClose();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('notionApiKey');
    localStorage.removeItem('notionClientDbId');
    localStorage.removeItem('notionNameColumn');
    localStorage.removeItem('notionPhoneColumn');
    localStorage.removeItem('notionTemplateDbId');
    localStorage.removeItem('notionTitleColumn');
    localStorage.removeItem('notionContentColumn');
    
    // Reset to defaults
    setApiKey('ntn_S61914752096psu0xk5XYrFRxzQXZrmp264GP8MVRD26N9');
    setClientDbId('1391710a6a09815fbcebc89f9f503e75');
    setNameColumn('Clients');
    setPhoneColumn('Téléphone ☎️');
    setTemplateDbId('2981710a6a09807abb22dbc5c5f7a1a5');
    setTitleColumn('Titre');
    setContentColumn('Contenu');

    setIsConnected(false);
    onDisconnect();
    alert("Déconnexion de Notion réussie.");
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 p-6 relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
          aria-label="Fermer"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Réglages Notion</h2>

        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Clé d'API Notion (Internal Integration Token)
              </label>
              <input type="password" id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="secret_..."/>
            </div>

            {/* Clients Database */}
            <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-4">
                  <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  <h3 className="text-lg font-semibold">Base de Données Clients</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="clientDbId" className="block text-sm font-medium text-gray-700 mb-1">ID de la Base de Données</label>
                        <input type="text" id="clientDbId" value={clientDbId} onChange={e => setClientDbId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="nameColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Nom'</label>
                        <input type="text" id="nameColumn" value={nameColumn} onChange={e => setNameColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="phoneColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Téléphone'</label>
                        <input type="text" id="phoneColumn" value={phoneColumn} onChange={e => setPhoneColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                </div>
            </div>

            {/* Templates Database */}
            <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-teal-600" />
                  <h3 className="text-lg font-semibold">Base de Données Modèles <span className="text-sm font-normal text-gray-500">(Optionnel)</span></h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="templateDbId" className="block text-sm font-medium text-gray-700 mb-1">ID de la Base de Données</label>
                        <input type="text" id="templateDbId" value={templateDbId} onChange={e => setTemplateDbId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Laisser vide pour utiliser les modèles par défaut" />
                    </div>
                    <div>
                        <label htmlFor="titleColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Titre'</label>
                        <input type="text" id="titleColumn" value={titleColumn} onChange={e => setTitleColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="contentColumn" className="block text-sm font-medium text-gray-700 mb-1">Nom de la colonne 'Contenu'</label>
                        <input type="text" id="contentColumn" value={contentColumn} onChange={e => setContentColumn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                  onClick={handleConnect}
                  className="w-full px-4 py-2.5 rounded-md font-semibold text-white bg-black hover:bg-gray-800 transition"
              >
                {isConnected ? 'Mettre à jour' : 'Connecter'}
              </button>
              {isConnected && (
                <button 
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2.5 rounded-md font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition"
                >Se déconnecter</button>
              )}
            </div>
             <p className="text-xs text-gray-400 mt-4 text-center">
                Vos informations sont stockées localement dans votre navigateur.
            </p>
          </div>
      </div>
       <style>{`
          @keyframes fadeInScale {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-fade-in-scale {
            animation: fadeInScale 0.2s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default SettingsModal;