import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Client, Template, Step } from './types';
import { CLIENTS, TEMPLATES } from './constants';
import ClientSelector from './components/ClientSelector';
import TemplateSelector from './components/TemplateSelector';
import Composer from './components/Composer';
import SettingsModal from './components/SettingsModal';
import { HomeIcon, SettingsIcon, NotionIcon, SpinnerIcon, DocumentTextIcon, MailIcon, ExternalLinkIcon, ClipboardCopyIcon } from './components/IconComponents';
import { fetchNotionTemplates } from './services/notion';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.SELECT_CLIENT);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);

  const [notionTemplatesLoading, setNotionTemplatesLoading] = useState<boolean>(false);
  const [notionError, setNotionError] = useState<string | null>(null);

  const [templateDbId, setTemplateDbId] = useState('');
  
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const loadNotionTemplates = useCallback(async () => {
    const savedApiKey = localStorage.getItem('notionApiKey');
    const savedTemplateDbId = localStorage.getItem('notionTemplateDbId');
    const savedTitleColumn = localStorage.getItem('notionTitleColumn');
    const savedContentColumn = localStorage.getItem('notionContentColumn');

    if(savedTemplateDbId) setTemplateDbId(savedTemplateDbId);

    if (savedApiKey && savedTemplateDbId && savedTitleColumn && savedContentColumn) {
      setNotionTemplatesLoading(true);
      setNotionError(null);
      try {
        const notionTemplates = await fetchNotionTemplates(savedApiKey, savedTemplateDbId, savedTitleColumn, savedContentColumn);
        if (notionTemplates.length > 0) {
          setTemplates(notionTemplates);
        } else {
          setTemplates(TEMPLATES); // Fallback
           setNotionError("Aucun modèle de SMS trouvé dans Notion. Utilisation des modèles par défaut.");
        }
      } catch (error) {
        console.error("Template fetch error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue.";
        setNotionError(`Modèles: ${errorMessage}`);
        setTemplates(TEMPLATES);
      } finally {
        setNotionTemplatesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const defaultConfig = {
      notionApiKey: 'ntn_S61914752096psu0xk5XYrFRxzQXZrmp264GP8MVRD26N9',
      notionClientDbId: '1391710a6a09815fbcebc89f9f503e75',
      notionNameColumn: 'Clients',
      notionPhoneColumn: 'Téléphone ☎️',
      notionTemplateDbId: '2981710a6a09807abb22dbc5c5f7a1a5',
      notionTitleColumn: 'Titre',
      notionContentColumn: 'Contenu',
    };

    Object.entries(defaultConfig).forEach(([key, value]) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, value);
      }
    });
    
    loadNotionTemplates();
  }, [loadNotionTemplates]);

  const handleDisconnectNotion = () => {
    setTemplates(TEMPLATES);
    setNotionError(null);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setStep(Step.SELECT_TEMPLATE);
  };

  const handleSelectTemplate = (template: Template) => {
    if (!selectedClient) return;
    setPhoneNumber(selectedClient.phone);
    setMessage(template.content.replace('{clientName}', selectedClient.name));
    setStep(Step.COMPOSE);
  };
  
  const handleOpenOnoff = () => {
    const onoffUrl = "https://phone.onoff.app/messages";
    const windowFeatures = "width=800,height=900,resizable=yes,scrollbars=yes";
    window.open(onoffUrl, 'onoffWindow', windowFeatures);
  };

  const goToStep = (targetStep: Step) => {
    if (targetStep === Step.SELECT_CLIENT) {
        setSelectedClient(null);
        setPhoneCopied(false);
        setMessageCopied(false);
    }
    setStep(targetStep);
  }

  const handleDashboardCopy = (text: string, type: 'phone' | 'message') => {
    const showSuccess = () => {
      if (type === 'phone') {
        setPhoneCopied(true);
        setTimeout(() => setPhoneCopied(false), 2000);
      } else {
        setMessageCopied(true);
        setTimeout(() => setMessageCopied(false), 2000);
      }
    };

    // Fallback function for browsers/iframes that don't support the Clipboard API
    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make it invisible and out of the way
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
          console.error('Fallback: Unable to copy');
          alert("La copie a échoué. Veuillez copier le texte manuellement.");
        }
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        alert("La copie a échoué. Veuillez copier le texte manuellement.");
      }

      document.body.removeChild(textArea);
    };

    // Try modern Clipboard API, then fallback
    if (!navigator.clipboard) {
      fallbackCopy();
      return;
    }
    navigator.clipboard.writeText(text).then(showSuccess).catch((err) => {
      console.warn('navigator.clipboard.writeText failed, trying fallback.', err);
      fallbackCopy();
    });
  };

  const stepTitles = [
    "Étape 1: Recherchez un client",
    "Étape 2: Choisissez un modèle de SMS",
    "Étape 3: Finalisez l'envoi"
  ];

  const CurrentStepComponent = useMemo(() => {
    switch (step) {
      case Step.SELECT_CLIENT:
        return <ClientSelector onSelectClient={handleSelectClient} />;
      case Step.SELECT_TEMPLATE:
        return (
          selectedClient && (
            <TemplateSelector
              templates={templates}
              selectedClient={selectedClient}
              onSelectTemplate={handleSelectTemplate}
              onBack={() => goToStep(Step.SELECT_CLIENT)}
            />
          )
        );
      case Step.COMPOSE:
        return (
          selectedClient && (
            <Composer
              client={selectedClient}
              message={message}
              onBack={() => goToStep(Step.SELECT_TEMPLATE)}
            />
          )
        );
      default:
        return null;
    }
  }, [step, selectedClient, message, templates]);

  return (
    <div className="w-full min-h-screen font-sans text-gray-900 bg-slate-100 flex justify-center">
      <div className="w-full max-w-7xl flex flex-row shadow-2xl bg-white">
        
        {/* Left Column: App */}
        <div className="relative flex flex-col w-full md:w-1/2 lg:w-2/5 xl:w-1/3 min-h-screen border-r border-gray-200">
          <div className="flex-grow p-4 sm:p-8 pb-24 overflow-y-auto">
              <header className="text-center mb-10">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8C0343] via-[#FF0175] to-[#FFCCE4]">
                      Gestionnaire SMS
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
                      {stepTitles[step]}
                  </p>
              </header>

              <main className="w-full">
                  {notionTemplatesLoading && (
                      <div className="flex justify-center items-center p-8">
                          <SpinnerIcon className="w-8 h-8 text-indigo-600 mr-3" />
                          <p className="text-gray-600 text-lg">Chargement des modèles...</p>
                      </div>
                  )}
                  {notionError && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg relative mb-6 max-w-2xl mx-auto" role="alert">
                          <p className="font-bold">Erreur de connexion à Notion</p>
                          <pre className="whitespace-pre-wrap">{notionError}</pre>
                      </div>
                  )}
                  {CurrentStepComponent}
              </main>
          </div>

          <footer className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-t-lg">
              <nav className="max-w-4xl mx-auto px-4 flex justify-around items-center h-16">
                  <button onClick={() => goToStep(Step.SELECT_CLIENT)} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24" aria-label="Accueil">
                      <HomeIcon className="w-7 h-7" />
                      <span className="text-xs font-medium">Accueil</span>
                  </button>
                  <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24">
                      <MailIcon className="w-7 h-7" />
                      <span className="text-xs font-medium">Mail</span>
                  </a>
                  <a href={`notion://www.notion.so/${templateDbId.replace(/-/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24" aria-disabled={!templateDbId}>
                      <DocumentTextIcon className="w-7 h-7" />
                      <span className="text-xs font-medium">Modèles</span>
                  </a>
                  <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24" aria-label="Réglages">
                      <SettingsIcon className="w-7 h-7" />
                      <span className="text-xs font-medium">Réglages</span>
                  </button>
              </nav>
          </footer>
        </div>
        
        {/* Right Column: Interactive Panel */}
        <div className="hidden md:flex flex-col flex-grow bg-gray-100 p-4">
          <div className="flex-grow flex flex-col bg-white rounded-lg shadow-inner border border-gray-300">
              <div className="flex items-center p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-shrink-0">
                  <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-grow mx-4">
                      <div className="w-full bg-gray-200 rounded-full px-4 py-1 text-sm text-gray-600 truncate">
                          Panneau de Contrôle On/Off
                      </div>
                  </div>
              </div>

              <div className="flex-grow flex flex-col justify-center items-center p-8 text-center">
                  {step === Step.COMPOSE ? (
                    <div className="w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800">Plan d'action pour l'envoi</h3>
                        <p className="mt-2 text-gray-600">
                            Suivez ces étapes dans l'ordre pour envoyer votre message.
                        </p>
                        <div className="mt-8 space-y-4 text-left">
                           
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8A003C] text-white flex items-center justify-center font-bold">1</div>
                                <div className="flex-grow">
                                    <button onClick={() => handleDashboardCopy(phoneNumber, 'phone')} className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                                        <span className="font-semibold">Copier le numéro</span>
                                        {phoneCopied ? <span className="font-bold text-[#8A003C]">Copié !</span> : <ClipboardCopyIcon className="w-5 h-5 text-gray-500" />}
                                    </button>
                                </div>
                            </div>
                           
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8A003C] text-white flex items-center justify-center font-bold">2</div>
                                <div className="flex-grow">
                                    <button onClick={handleOpenOnoff} className="w-full flex items-center justify-between p-4 rounded-lg bg-black text-white hover:bg-gray-800 transition">
                                        <span className="font-semibold">Ouvrir On/Off</span>
                                        <ExternalLinkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">3</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600">Dans On/Off, cliquez sur "Nouveau Message" puis collez le numéro.</p>
                                </div>
                            </div>
                           
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8A003C] text-white flex items-center justify-center font-bold">4</div>
                                <div className="flex-grow">
                                    <button onClick={() => handleDashboardCopy(message, 'message')} className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                                        <span className="font-semibold">Copier le message</span>
                                        {messageCopied ? <span className="font-bold text-[#8A003C]">Copié !</span> : <ClipboardCopyIcon className="w-5 h-5 text-gray-500" />}
                                    </button>
                                </div>
                            </div>
                           
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">5</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600">Collez le message dans la zone de texte.</p>
                                </div>
                            </div>

                             <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">6</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600">Envoyez !</p>
                                </div>
                            </div>
                        </div>
                    </div>
                  ) : (
                    <div className="max-w-md">
                        <h3 className="text-xl font-bold text-[#8A003C]">Interface On/Off</h3>
                        <p className="mt-2 text-gray-600">
                            Pour des raisons de sécurité, On/Off ne peut pas être intégré directement.
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            Ce panneau deviendra votre tableau de bord d'envoi lorsque vous arriverez à la dernière étape.
                        </p>
                    </div>
                  )}
              </div>
          </div>
        </div>

      </div>
        
      <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          onConnect={loadNotionTemplates}
          onDisconnect={handleDisconnectNotion}
      />
    </div>
  );
};

export default App;
