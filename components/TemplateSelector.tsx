import React, { useState } from 'react';
import { Template, Client } from '../types';
import { MessageIcon, ArrowLeftIcon, ClipboardCopyIcon } from './IconComponents';

interface TemplateSelectorProps {
  templates: Template[];
  selectedClient: Client;
  onSelectTemplate: (template: Template) => void;
  onBack: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, selectedClient, onSelectTemplate, onBack }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    const showSuccess = () => {
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 2000);
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
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-200 transition mr-4"
        >
          <ArrowLeftIcon />
        </button>
        <div>
            <p className="text-sm text-gray-500">Client sélectionné :</p>
            <div className="flex items-center gap-2">
                <p className="font-bold text-lg text-gray-800">{selectedClient.name}</p>
                 <button 
                    onClick={() => handleCopy(selectedClient.name, 'client-name')} 
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Copier le nom du client"
                >
                    {copiedItem === 'client-name' ? (
                        <span className="text-xs text-teal-600 font-bold px-1">Copié!</span>
                    ) : (
                        <ClipboardCopyIcon className="w-4 h-4 text-gray-500" />
                    )}
                </button>
            </div>
        </div>
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {templates.map(template => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="p-4 bg-white rounded-xl shadow-sm border border-transparent hover:border-teal-500 hover:shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="flex items-start">
              <div className="p-3 bg-teal-100 rounded-full mr-4">
                <MessageIcon className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg text-gray-800">{template.title}</p>
                <p className="text-sm text-gray-500 mt-1 italic">"{template.content.replace('{clientName}', selectedClient.name)}"</p>
              </div>
               <button
                  onClick={(e) => {
                      e.stopPropagation();
                      const message = template.content.replace('{clientName}', selectedClient.name);
                      handleCopy(message, template.id);
                  }}
                  className="ml-2 p-2 rounded-full hover:bg-gray-100 flex-shrink-0 self-center"
                  aria-label="Copier le message"
              >
                  {copiedItem === template.id ? (
                      <span className="text-xs text-teal-600 font-bold px-1">Copié!</span>
                  ) : (
                      <ClipboardCopyIcon className="w-5 h-5 text-gray-500" />
                  )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
