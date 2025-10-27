import { Client, Template } from './types';

export const CLIENTS: Client[] = [
  { id: '1', name: 'Marie Dubois', phone: '+33612345678' },
  { id: '2', name: 'Pierre Martin', phone: '+33687654321' },
  { id: '3', name: 'Chloé Bernard', phone: '+33711223344' },
  { id: '4', name: 'Julien Petit', phone: '+33655667788' },
  { id: '5', name: 'Léa Robert', phone: '+33788776655' },
  { id: '6', name: 'Lucas Garcia', phone: '+33612312312' },
  { id: '7', name: 'Manon Moreau', phone: '+33745645645' },
];

export const TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Merci de votre visite',
    content: 'Bonjour {clientName}, merci pour votre visite ! Nous espérons que tout s\'est bien passé et nous avons hâte de vous revoir bientôt.',
  },
  {
    id: '2',
    title: 'Absence au rendez-vous',
    content: 'Bonjour {clientName}, nous avons remarqué votre absence à votre rendez-vous aujourd\'hui. Souhaitez-vous que nous en planifions un nouveau ?',
  },
  {
    id: '3',
    title: 'Demande d\'avis Google',
    content: 'Bonjour {clientName}, votre avis est précieux ! Pourriez-vous prendre un instant pour nous laisser un commentaire sur Google ? Cela nous aide énormément. Merci ! [Lien vers Google]',
  },
  {
    id: '4',
    title: 'Rappel de Rendez-vous',
    content: 'Bonjour {clientName}, nous vous confirmons votre rendez-vous pour le [DATE] à [HEURE]. En cas d\'empêchement, merci de nous prévenir. À bientôt !',
  },
  {
    id: '5',
    title: 'Demande de Prépaiement ⚠️',
    content: 'Bonjour {clientName}, afin de confirmer votre rendez-vous, un prépaiement est nécessaire. Merci de le régler via ce lien : [LIEN DE PAIEMENT]',
  },
  {
    id: '6',
    title: '⛔️ Pas venu',
    content: 'Bonjour {clientName}, nous avons remarqué votre absence à votre rendez-vous d\'aujourd\'hui. Souhaitez-vous que nous en planifions un nouveau ?',
  },
];
