import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Client, Template, Step, DataSource } from './types';
import { CLIENTS, TEMPLATES } from './constants';
import ClientSelector from './components/ClientSelector';
import TemplateSelector from './components/TemplateSelector';
import Composer from './components/Composer';
import SettingsModal from './components/SettingsModal';
import NoShowSelector from './components/NoShowSelector';
import { HomeIcon, SettingsIcon, NotionIcon, SpinnerIcon, DocumentTextIcon, MailIcon, ExternalLinkIcon, ClipboardCopyIcon, NoShowIcon, OnOffIcon, StreamDeckIcon } from './components/IconComponents';
import { fetchNotionTemplates } from './services/notion';
import { fetchAirtableTemplates } from './services/airtable';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.SELECT_CLIENT);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectionContext, setSelectionContext] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [externalDbLink, setExternalDbLink] = useState('#');
  const [externalDbName, setExternalDbName] = useState('Modèles');

  const [phoneCopied, setPhoneCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const onoffWindowRef = useRef<Window | null>(null);

  const loadDataFromSource = useCallback(async () => {
    const dataSource = localStorage.getItem('dataSource') as DataSource || 'notion';
    
    setTemplatesLoading(true);
    setDataError(null);
    setTemplates(TEMPLATES); // Fallback while loading

    try {
        let loadedTemplates: Template[] = [];

        if (dataSource === 'notion') {
            const savedApiKey = localStorage.getItem('notionApiKey');
            const savedTemplateDbId = localStorage.getItem('notionTemplateDbId');
            const savedTitleColumn = localStorage.getItem('notionTitleColumn');
            const savedContentColumn = localStorage.getItem('notionContentColumn');

            if (savedApiKey && savedTemplateDbId && savedTitleColumn && savedContentColumn) {
                loadedTemplates = await fetchNotionTemplates(savedApiKey, savedTemplateDbId, savedTitleColumn, savedContentColumn);
                setExternalDbLink(`notion://www.notion.so/${savedTemplateDbId.replace(/-/g, '')}`);
                setExternalDbName('Notion');
            }
        } else if (dataSource === 'airtable') {
            const savedPat = localStorage.getItem('airtablePat');
            const savedBaseId = localStorage.getItem('airtableBaseId');
            const savedTable = localStorage.getItem('airtableTemplateTable');
            const savedTitle = localStorage.getItem('airtableTemplateTitle');
            const savedContent = localStorage.getItem('airtableTemplateContent');

            if (savedPat && savedBaseId && savedTable && savedTitle && savedContent) {
                loadedTemplates = await fetchAirtableTemplates(savedPat, savedBaseId, savedTable, savedTitle, savedContent);
                setExternalDbLink(`https://airtable.com/${savedBaseId}`);
                setExternalDbName('Airtable');
            }
        }

        if (loadedTemplates.length > 0) {
            setTemplates(loadedTemplates);
        } else {
            setTemplates(TEMPLATES);
            setDataError("Aucun modèle trouvé. Utilisation des modèles par défaut.");
            setExternalDbLink('#');
            setExternalDbName('Modèles');
        }
    } catch (error) {
        console.error("Template fetch error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue.";
        setDataError(`Modèles: ${errorMessage}`);
        setTemplates(TEMPLATES);
        setExternalDbLink('#');
        setExternalDbName('Modèles');
    } finally {
        setTemplatesLoading(false);
    }
  }, []);


  useEffect(() => {
    loadDataFromSource();
  }, [loadDataFromSource]);

  const handleDisconnect = () => {
    setTemplates(TEMPLATES);
    setDataError(null);
    setExternalDbLink('#');
    setExternalDbName('Modèles');
  };

  const handleSelectClient = (client: Client, context?: string) => {
    setSelectedClient(client);
    setSelectionContext(context || null);
    setStep(Step.SELECT_TEMPLATE);
  };

  const handleSelectTemplate = (template: Template) => {
    if (!selectedClient) return;
    const formattedMessage = template.content.replace('{clientName}', selectedClient.name);
    
    setPhoneNumber(selectedClient.phone);
    setMessage(formattedMessage);

    if (selectionContext === 'appointmentConfirmation' || selectionContext === 'noShow') {
      handleDashboardCopy(formattedMessage, 'message');
      handleOpenOnoff();
    }
    
    setStep(Step.COMPOSE);
  };
  
  const handleOpenOnoff = () => {
    const onoffUrl = "https://phone.onoff.app/messages";
    const windowFeatures = "width=800,height=900,resizable=yes,scrollbars=yes";
    const win = window.open(onoffUrl, 'onoffWindow', windowFeatures);
    onoffWindowRef.current = win;
  };

  const handleFocusOnoff = () => {
    // If we have a reference, we assume the window might still be open and try to focus it.
    // We deliberately avoid checking `onoffWindowRef.current.closed` as it fails across
    // different domains due to browser security policies.
    // Crucially, we do NOT have an `else` block to re-open the window. This prevents
    // the page from being reloaded if the reference is lost (e.g., main app reloaded)
    // or if the user manually closed the On/Off window. The button's only job is to focus.
    if (onoffWindowRef.current) {
      onoffWindowRef.current.focus();
    }
  };

  const goToStep = (targetStep: Step) => {
    if (targetStep === Step.SELECT_CLIENT || targetStep === Step.NO_SHOWS) {
        setSelectedClient(null);
        setPhoneCopied(false);
        setMessageCopied(false);
        setSelectionContext(null);
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

  const stepTitles = [
    "Étape 1: Recherchez un client",
    "Étape 2: Choisissez un modèle de SMS",
    "Étape 3: Finalisez l'envoi",
    "Clients absents du jour"
  ];
  
  const filteredTemplates = useMemo(() => {
    if (selectionContext === 'appointmentConfirmation') {
      const allowedTitles = ["Rappel de Rendez-vous", "Demande de Prépaiement ⚠️"];
      return templates.filter(t => allowedTitles.includes(t.title));
    }
    if (selectionContext === 'noShow') {
      const allowedTitles = ["⛔️ Pas venu", "Demande de Prépaiement ⚠️"];
      return templates.filter(t => allowedTitles.includes(t.title));
    }
    return templates;
  }, [templates, selectionContext]);

  const CurrentStepComponent = useMemo(() => {
    switch (step) {
      case Step.SELECT_CLIENT:
        return <ClientSelector onSelectClient={handleSelectClient} />;
      case Step.SELECT_TEMPLATE:
        return (
          selectedClient && (
            <TemplateSelector
              templates={filteredTemplates}
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
              context={selectionContext}
            />
          )
        );
      case Step.NO_SHOWS:
        return <NoShowSelector onSelectClient={handleSelectClient} />;
      default:
        return null;
    }
  }, [step, selectedClient, message, filteredTemplates, selectionContext]);
  
  const NavLinks = () => (
    <>
      <button onClick={() => goToStep(Step.SELECT_CLIENT)} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100" aria-label="Accueil">
          <HomeIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">Accueil</span>
      </button>
      <button onClick={handleOpenOnoff} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100" aria-label="Ouvrir On/Off">
          <OnOffIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">On/Off</span>
      </button>
      <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100">
          <MailIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">Mail</span>
      </a>
      <button onClick={() => goToStep(Step.NO_SHOWS)} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100" aria-label="Clients absents">
          <NoShowIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">Pas Venu</span>
      </button>
      <a href={externalDbLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100" aria-disabled={externalDbLink === '#'}>
          <DocumentTextIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">{externalDbName}</span>
      </a>
      <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center justify-center text-[#8A003C] hover:text-[#FF0175] transition-colors w-24 py-2 rounded-lg hover:bg-slate-100" aria-label="Réglages">
          <SettingsIcon className="w-7 h-7" />
          <span className="text-xs font-medium mt-1">Réglages</span>
      </button>
    </>
  );

  return (
    <div className="w-full min-h-screen font-sans text-gray-900 bg-slate-100 flex justify-center">
      <div className="w-full max-w-7xl flex flex-row shadow-2xl bg-white">
        
        {/* Desktop Vertical Nav */}
        <nav className="hidden md:flex flex-col items-center justify-start space-y-4 pt-6 bg-white border-r border-gray-200 w-24 flex-shrink-0">
          <NavLinks />
        </nav>

        {/* Main content area */}
        <div className="relative flex flex-col w-full md:w-[440px] flex-shrink-0 min-h-screen border-r border-gray-200">
          <div className="flex-grow p-4 sm:p-8 pb-24 overflow-y-auto">
              <header className="text-center mb-10">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#8C0343] via-[#FF0175] to-[#FFCCE4]">
                      Gestionnaire SMS
                  </h1>
                   <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8C0343] via-[#FF0175] to-[#FFCCE4] tracking-wider mt-1">
                        0460 21 55 57
                   </p>
                  <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                      {stepTitles[step]}
                  </p>
              </header>

              <main className="w-full">
                  {templatesLoading && (
                      <div className="flex justify-center items-center p-8">
                          <SpinnerIcon className="w-8 h-8 text-indigo-600 mr-3" />
                          <p className="text-gray-600 text-lg">Chargement des modèles...</p>
                      </div>
                  )}
                  {dataError && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg relative mb-6 max-w-2xl mx-auto" role="alert">
                          <p className="font-bold">Erreur de connexion</p>
                          <pre className="whitespace-pre-wrap">{dataError}</pre>
                      </div>
                  )}
                  {CurrentStepComponent}
              </main>
          </div>

          {/* Mobile Bottom Nav */}
          <footer className="md:hidden absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-t-lg">
              <nav className="max-w-4xl mx-auto px-4 flex justify-around items-center h-16">
                  <NavLinks />
              </nav>
          </footer>
        </div>
        
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

              <div className="flex-grow flex flex-col justify-start items-center p-8 text-center pt-6">
                  {step === Step.COMPOSE ? (
                    <div className="w-full max-w-md">
                        <h3 className="text-2xl font-bold text-gray-800">Plan d'action pour l'envoi</h3>
                        <p className="mt-2 text-gray-600">
                            Suivez ces étapes dans l'ordre pour envoyer votre message.
                        </p>
                        <div className="mt-8 space-y-4 text-left">
                           
                            {/* Etape 1: Copier le message */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8A003C] text-white flex items-center justify-center font-bold">1</div>
                                <div className="flex-grow">
                                    <button onClick={() => handleDashboardCopy(message, 'message')} className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
                                        <span className="font-semibold">Copier le message</span>
                                        {messageCopied ? <span className="font-bold text-[#8A003C]">Copié !</span> : <ClipboardCopyIcon className="w-5 h-5 text-gray-500" />}
                                    </button>
                                </div>
                            </div>
                           
                            {/* Etape 2: Ouvrir On/Off */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#8A003C] text-white flex items-center justify-center font-bold">2</div>
                                <div className="flex-grow">
                                    <button onClick={handleOpenOnoff} className="w-full flex items-center justify-between p-4 rounded-lg bg-black text-white hover:bg-gray-800 transition">
                                        <span className="font-semibold">Ouvrir On/Off</span>
                                        <ExternalLinkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Etape 3: Ecrire le numéro */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">3</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Dans On/Off, cliquez sur "Nouveau Message" puis écrivez le numéro de téléphone dans la zone "Entrez un nom ou numéro".
                                    </p>
                                </div>
                            </div>
                           
                            {/* Etape 4: Coller le message */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">4</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Collez ensuite le message dans la zone "Ecrire un message" (en appuyant sur la touche "Coller" sur le cartouchier <StreamDeckIcon className="w-5 h-5 inline-block align-middle ml-1" />).
                                    </p>
                                </div>
                            </div>
                           
                            {/* Etape 5: Envoyer */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold">5</div>
                                <div className="flex-grow pt-3">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Envoyez le message en cliquant sur le bouton (ou en appuyant sur la touche "Envoyer" sur le cartouchier <StreamDeckIcon className="w-5 h-5 inline-block align-middle ml-1" />).
                                    </p>
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
          onConnect={loadDataFromSource}
          onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default App;