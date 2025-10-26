
import React from 'react';
import { Template, Client } from '../types';
import { MessageIcon, ArrowLeftIcon } from './IconComponents';

interface TemplateSelectorProps {
  templates: Template[];
  selectedClient: Client;
  onSelectTemplate: (template: Template) => void;
  onBack: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, selectedClient, onSelectTemplate, onBack }) => {
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
            <p className="font-bold text-lg text-gray-800">{selectedClient.name}</p>
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
                <p className="text-gray-500 mt-1 italic">"{template.content.replace('{clientName}', selectedClient.name)}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
