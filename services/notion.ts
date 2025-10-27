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
    let hasMore = true;
    let startCursor: string | undefined = undefined;
    let isFirstPage = true;
    const PROXY_URL = 'https://corsproxy.io/?';

    while (hasMore) {
        // Add a delay between requests to avoid rate limiting, except for the first page.
        if (!isFirstPage) {
            await sleep(350); // 350ms delay
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
            switch(response.status) {
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
            throw new Error(friendlyMessage);
        }

        const data = await response.json();
        
        const resultsFromPage = data.results
            .map(mapper)
            .filter((item: any) => item !== null);
        
        allResults = [...allResults, ...resultsFromPage];

        hasMore = data.has_more;
        startCursor = data.next_cursor;
        isFirstPage = false; // Mark that the first page has been fetched
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