import { Client, Template } from '../types';

interface AirtableRecord {
    id: string;
    fields: { [key: string]: any };
    createdTime: string;
}

const mapAirtableRecordToClient = (record: AirtableRecord, nameColumn: string, phoneColumn: string): Client | null => {
    const name = record.fields[nameColumn];
    const phone = record.fields[phoneColumn];

    if (typeof name === 'string' && typeof phone === 'string') {
        return {
            id: record.id,
            name,
            phone,
        };
    }
    return null;
};

const mapAirtableRecordToTemplate = (record: AirtableRecord, titleColumn: string, contentColumn: string): Template | null => {
    const title = record.fields[titleColumn];
    const content = record.fields[contentColumn];

    if (typeof title === 'string' && typeof content === 'string') {
        return {
            id: record.id,
            title,
            content,
        };
    }
    return null;
};

const fetchPaginatedFromAirtable = async (
    pat: string,
    baseId: string,
    tableName: string,
    mapper: (record: AirtableRecord) => any,
    filterFormula?: string
) => {
    let allResults: any[] = [];
    let offset: string | undefined = undefined;
    const PROXY_URL = 'https://corsproxy.io/?';

    const constructUrl = () => {
        let apiUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
        const params = new URLSearchParams();
        if (filterFormula) {
            params.append('filterByFormula', filterFormula);
        }
        if (offset) {
            params.append('offset', offset);
        }
        const paramString = params.toString();
        if (paramString) {
            apiUrl += `?${paramString}`;
        }
        return `${PROXY_URL}${apiUrl}`;
    };

    do {
        const url = constructUrl();
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${pat}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
            let friendlyMessage = `Erreur ${response.status}: ${errorData.error?.message || response.statusText}`;

            switch(response.status) {
                case 401: friendlyMessage = "Token d'accès personnel Airtable invalide ou expiré."; break;
                case 403: friendlyMessage = "Accès interdit. Vérifiez les permissions de votre token."; break;
                case 404: friendlyMessage = "Ressource non trouvée. Vérifiez l'ID de la base ou le nom de la table."; break;
                case 422: friendlyMessage = "Erreur de traitement. Vérifiez les noms des colonnes dans les réglages."; break;
            }
            throw new Error(friendlyMessage);
        }
        
        const data = await response.json();
        const mappedRecords = data.records.map(mapper).filter((item: any) => item !== null);
        allResults = [...allResults, ...mappedRecords];
        offset = data.offset;
    } while (offset);
    
    return allResults;
};

export const searchAirtableClients = async (
    pat: string,
    baseId: string,
    tableName: string,
    nameColumn: string,
    phoneColumn: string,
    query: string
): Promise<Client[]> => {
    if (!query) return [];
    const sanitizedQuery = query.replace(/"/g, '\\"');
    const filterFormula = `SEARCH(LOWER("${sanitizedQuery}"), LOWER({${nameColumn}}))`;

    return fetchPaginatedFromAirtable(pat, baseId, tableName, 
        (record) => mapAirtableRecordToClient(record, nameColumn, phoneColumn), 
        filterFormula
    );
};

export const fetchAirtableTemplates = async (
    pat: string,
    baseId: string,
    tableName: string,
    titleColumn: string,
    contentColumn: string
): Promise<Template[]> => {
    return fetchPaginatedFromAirtable(pat, baseId, tableName, 
        (record) => mapAirtableRecordToTemplate(record, titleColumn, contentColumn)
    );
};