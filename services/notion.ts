import { Client, Template } from '../types';

// Types simplifiés pour l'API Notion
interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
}

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to recursively extract plain text from a Notion property, handling various types including rollups and formulas.
 */
const getPlainTextFromProp = (prop: any): string | null => {
    if (!prop) return null;

    switch (prop.type) {
        case 'title':
            return prop.title?.[0]?.plain_text || null;
        case 'rich_text':
            return prop.rich_text?.map((t: any) => t.plain_text).join('') || null;
        case 'select':
            return prop.select?.name || null;
        case 'phone_number':
            return prop.phone_number || null;
        case 'formula':
            if (prop.formula?.string) return prop.formula.string;
            if (prop.formula?.number !== null) return String(prop.formula.number);
            if (prop.formula?.boolean !== null) return String(prop.formula.boolean);
            if (prop.formula?.date?.start) return prop.formula.date.start;
            return null;
        case 'rollup':
            const array = prop.rollup?.array;
            if (!array || array.length === 0) return null;
            // Handle array of different types within rollup
            if (array[0].type === 'rich_text' || array[0].type === 'title') {
                 return array.map((item: any) => getPlainTextFromProp(item)).join(', ');
            }
            return getPlainTextFromProp(array[0]);
        case 'number':
             return prop.number !== null ? String(prop.number) : null;
        default:
            return null;
    }
};

/**
 * Mappe une page Notion à un objet Client.
 */
const mapNotionPageToClient = (page: NotionPage, nameColumn: string, phoneColumn: string): Client | null => {
  try {
    const nameProp = page.properties[nameColumn];
    const phoneProp = page.properties[phoneColumn];

    if (!nameProp || nameProp.type !== 'title' || !nameProp.title[0]?.plain_text) return null;
    
    let phone = '';
    if (phoneProp?.type === 'phone_number' && phoneProp.phone_number) {
        phone = phoneProp.phone_number;
    } else if (phoneProp?.type === 'rich_text' && phoneProp.rich_text[0]?.plain_text) {
        phone = phoneProp.rich_text[0].plain_text;
    }

    if (!phone) return null;
    
    const name = nameProp.title[0].plain_text;

    return { id: page.id, name, phone };
  } catch (error) {
    console.error('Erreur de mappage (Client):', page.id, error);
    return null;
  }
};

/**
 * Mappe une page de RDV Notion à un objet Client, en gérant les Rollups et en extrayant l'heure, les animaux, et le statut SMS.
 */
const mapNotionAppointmentToClient = (page: NotionPage, nameColumn: string, phoneColumn: string, hourColumn: string, petsColumn: string, smsSentColumn: string, noShowSmsSentColumn: string): Client | null => {
  try {
    const name = getPlainTextFromProp(page.properties[nameColumn]);
    const phone = getPlainTextFromProp(page.properties[phoneColumn]);

    if (!name || !phone) {
        console.warn(`Page de RDV ignorée ${page.id}: nom ou téléphone manquant.`, { 
            name: name, 
            phone: phone, 
            nameProp: page.properties[nameColumn],
            phoneProp: page.properties[phoneColumn]
        });
        return null;
    }
    
    let appointmentTime: string | undefined = undefined;
    
    if (hourColumn) {
        appointmentTime = getPlainTextFromProp(page.properties[hourColumn]) ?? undefined;
    }

    const pets = petsColumn ? getPlainTextFromProp(page.properties[petsColumn]) ?? undefined : undefined;
    const smsSent = smsSentColumn ? page.properties[smsSentColumn]?.checkbox ?? false : false;
    const noShowSmsSent = noShowSmsSentColumn ? page.properties[noShowSmsSentColumn]?.checkbox ?? false : false;

    return { id: page.id, name, phone, appointmentTime, pets, smsSent, noShowSmsSent };
  } catch (error) {
    console.error('Erreur de mappage (Appointment):', page.id, error);
    return null;
  }
};


/**
 * Mappe une page Notion à un objet Template.
 */
const mapNotionPageToTemplate = (page: NotionPage, titleColumn: string, contentColumn: string): Template | null => {
  try {
    const titleProp = page.properties[titleColumn];
    const contentProp = page.properties[contentColumn];

    if (!titleProp || titleProp.type !== 'title' || !titleProp.title[0]?.plain_text) return null;
    if (!contentProp || contentProp.type !== 'rich_text' || !contentProp.rich_text[0]?.plain_text) return null;

    const title = titleProp.title[0].plain_text;
    const content = contentProp.rich_text.map((t: any) => t.plain_text).join('');

    return { id: page.id, title, content };
  } catch (error) {
    console.error('Erreur de mappage (Template):', page.id, error);
    return null;
  }
};

const fetchPaginatedFromNotion = async (apiKey: string, databaseId: string, mapper: (page: NotionPage) => any, filter?: object) => {
    let allResults: any[] = [];
    let totalFetchedPages = 0;
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    let isFirstPage = true;
    const PROXY_URL = 'https://corsproxy.io/?';

    while (hasMore) {
        if (!isFirstPage) {
            await sleep(350);
        }

        const body: any = { page_size: 100 };
        if (startCursor) {
            body.start_cursor = startCursor;
        }
        if (filter) {
            body.filter = filter;
        }

        const NOTION_API_URL = `https://api.notion.com/v1/databases/${databaseId}/query`;
        const response = await fetch(`${PROXY_URL}${NOTION_API_URL}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('Erreur API Notion:', errorData);

            let friendlyMessage = `Erreur ${response.status}: ${errorData.message || response.statusText}`;
            if(errorData.code === "validation_error" && errorData.message.includes("is not a supported filter property type")) {
               friendlyMessage = `Erreur de filtre : La colonne de statut que vous essayez d'utiliser n'est pas un type "Select". L'API Notion ne permet de filtrer que les colonnes de type "Select". Essayez d'utiliser une autre colonne pour le statut.`;
            } else {
                switch(response.status) {
                    case 400:
                        if (errorData.message.includes("Could not find property")) {
                           friendlyMessage = `Erreur 400: Une des colonnes spécifiées dans les réglages est introuvable dans votre base de données Notion. Veuillez vérifier que les noms correspondent exactement (majuscules, espaces, émojis).`;
                        }
                        break;
                    case 401:
                        friendlyMessage = "Clé d'API Notion invalide ou expirée. Veuillez la vérifier dans les Réglages.";
                        break;
                    case 403:
                        friendlyMessage = "Accès interdit. Assurez-vous que votre intégration Notion a bien été partagée avec la base de données (via le menu Partager > Inviter).";
                        break;
                    case 404:
                        friendlyMessage = "Base de données non trouvée. Vérifiez que l'ID de la base de données est correct dans les Réglages.";
                        break;
                    case 429:
                        friendlyMessage = "Trop de requêtes envoyées à Notion. Veuillez patienter un moment avant de réessayer.";
                        break;
                }
            }
            throw new Error(friendlyMessage);
        }

        const data = await response.json();
        totalFetchedPages += data.results.length;

        const resultsFromPage = data.results
            .map(mapper)
            .filter((item: any) => item !== null);
        
        allResults = [...allResults, ...resultsFromPage];

        hasMore = data.has_more;
        startCursor = data.next_cursor;
        isFirstPage = false;
    }

    if (totalFetchedPages > 0 && allResults.length === 0) {
        throw new Error(
            "Des rendez-vous ont été trouvés dans Notion, mais aucun n'a pu être lu.\n\n" +
            "Vérifiez que les noms des colonnes dans les Réglages correspondent EXACTEMENT à ceux dans Notion (majuscules, espaces, emojis inclus)."
        );
    }

    return allResults;
};

export const searchNotionClients = async (apiKey: string, databaseId: string, nameColumn: string, phoneColumn: string, query: string): Promise<Client[]> => {
    if (!query) return [];
    const filter = {
        property: nameColumn,
        title: {
            contains: query,
        },
    };
    return fetchPaginatedFromNotion(apiKey, databaseId, (page) => mapNotionPageToClient(page, nameColumn, phoneColumn), filter);
};


export const fetchNotionTemplates = async (apiKey: string, databaseId: string, titleColumn: string, contentColumn: string): Promise<Template[]> => {
    return fetchPaginatedFromNotion(apiKey, databaseId, (page) => mapNotionPageToTemplate(page, titleColumn, contentColumn));
};

export const fetchNotionAppointmentsForTomorrow = async (apiKey: string, databaseId: string, dateColumn: string, nameColumn: string, phoneColumn: string, hourColumn: string, petsColumn: string, smsSentColumn: string): Promise<Client[]> => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    const filter = {
        property: dateColumn,
        date: {
            equals: tomorrowISO,
        },
    };

    return fetchPaginatedFromNotion(apiKey, databaseId, (page) => mapNotionAppointmentToClient(page, nameColumn, phoneColumn, hourColumn, petsColumn, smsSentColumn, ''), filter);
};

export const fetchNotionNoShowsForToday = async (apiKey: string, databaseId: string, dateColumn: string, nameColumn: string, phoneColumn: string, hourColumn: string, statusColumn: string, noShowStatus: string, petsColumn: string, smsSentColumn: string, noShowSmsSentColumn: string): Promise<Client[]> => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    const filter = {
        property: dateColumn,
        date: {
            equals: todayISO,
        },
    };

    const mapper = (page: NotionPage) => {
        const client = mapNotionAppointmentToClient(page, nameColumn, phoneColumn, hourColumn, petsColumn, smsSentColumn, noShowSmsSentColumn);
        const statusValue = getPlainTextFromProp(page.properties[statusColumn]);
        return { client, statusValue };
    };

    const results = await fetchPaginatedFromNotion(apiKey, databaseId, mapper, filter);

    const noShowClients = results
        .filter(item => item.client && item.statusValue === noShowStatus)
        .map(item => item.client);

    return noShowClients as Client[];
};

export const updateNotionCheckbox = async (apiKey: string, pageId: string, propertyName: string, isChecked: boolean): Promise<void> => {
  const PROXY_URL = 'https://corsproxy.io/?';
  const NOTION_API_URL = `https://api.notion.com/v1/pages/${pageId}`;
  
  const body = {
    properties: {
      [propertyName]: {
        checkbox: isChecked,
      },
    },
  };

  const response = await fetch(`${PROXY_URL}${NOTION_API_URL}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Erreur API Notion (Update):', errorData);
    throw new Error(`Erreur lors de la mise à jour de Notion: ${errorData.message || response.statusText}`);
  }
};