import { Client, Template } from '../types';

interface AirtableRecord {
    id: string;
    fields: { [key: string]: any };
    createdTime: string;
}

const mapAirtableRecordToClient = (record: AirtableRecord, nameColumn: string, phoneColumn: string, dateColumn?: string, hourColumn?: string, petsColumn?: string, smsSentColumn?: string, noShowSmsSentColumn?: string): Client | null => {
    let name = record.fields[nameColumn];
    let phone = record.fields[phoneColumn];

    // Gérer les champs de type Lookup/Rollup qui retournent des tableaux
    if (Array.isArray(name) && name.length > 0) {
        name = name[0];
    }
    if (Array.isArray(phone) && phone.length > 0) {
        phone = phone[0];
    }

    if (typeof name !== 'string' || typeof phone !== 'string' || !name || !phone) {
        console.warn(`Enregistrement Airtable ignoré ${record.id}: nom ou téléphone invalide/manquant.`, { name, phone });
        return null;
    }

    let appointmentTime: string | undefined = undefined;

    if (hourColumn && record.fields[hourColumn]) {
        let hourValue = record.fields[hourColumn];
        if (Array.isArray(hourValue) && hourValue.length > 0) {
            hourValue = hourValue[0];
        }

        if (typeof hourValue === 'string' && hourValue.trim() !== '') {
            appointmentTime = hourValue;
        } else if (typeof hourValue === 'number') {
            appointmentTime = String(hourValue);
        }
    }
    
    if (!appointmentTime && dateColumn && record.fields[dateColumn]) {
        const dateValue = record.fields[dateColumn];
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                appointmentTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
        }
    }

    let pets: string | undefined = undefined;
    if (petsColumn && record.fields[petsColumn]) {
        let petsValue = record.fields[petsColumn];
        if (Array.isArray(petsValue)) {
            petsValue = petsValue.join(', ');
        }
        if (typeof petsValue === 'string' && petsValue.trim() !== '') {
            pets = petsValue;
        }
    }

    const smsSent = smsSentColumn ? !!record.fields[smsSentColumn] : false;
    const noShowSmsSent = noShowSmsSentColumn ? !!record.fields[noShowSmsSentColumn] : false;

    return {
        id: record.id,
        name,
        phone,
        appointmentTime,
        pets,
        smsSent,
        noShowSmsSent,
    };
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

export const fetchAirtableAppointmentsForTomorrow = async (
    pat: string,
    baseId: string,
    tableName: string,
    dateColumn: string,
    nameColumn: string,
    phoneColumn: string,
    hourColumn: string | undefined,
    petsColumn: string | undefined,
    smsSentColumn: string | undefined,
): Promise<Client[]> => {
    return fetchPaginatedFromAirtable(pat, baseId, tableName, 
        (record) => mapAirtableRecordToClient(record, nameColumn, phoneColumn, dateColumn, hourColumn, petsColumn, smsSentColumn)
    );
};

export const fetchAirtableNoShowsForToday = async (
    pat: string,
    baseId: string,
    tableName: string,
    dateColumn: string,
    nameColumn: string,
    phoneColumn: string,
    hourColumn: string | undefined,
    statusColumn: string,
    noShowStatus: string,
    petsColumn: string | undefined,
    smsSentColumn: string | undefined,
    noShowSmsSentColumn: string | undefined,
): Promise<Client[]> => {
    const filterFormula = `AND(IS_SAME({${dateColumn}}, TODAY(), 'day'), {${statusColumn}} = "${noShowStatus}")`;

    return fetchPaginatedFromAirtable(pat, baseId, tableName,
        (record) => mapAirtableRecordToClient(record, nameColumn, phoneColumn, dateColumn, hourColumn, petsColumn, smsSentColumn, noShowSmsSentColumn),
        filterFormula
    );
};

export const updateAirtableCheckbox = async (pat: string, baseId: string, tableName: string, recordId: string, fieldName: string, isChecked: boolean): Promise<void> => {
    const PROXY_URL = 'https://corsproxy.io/?';
    const url = `${PROXY_URL}https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;

    const body = {
        fields: {
            [fieldName]: isChecked,
        },
    };

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${pat}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        console.error('Erreur API Airtable (Update):', errorData);
        throw new Error(`Erreur lors de la mise à jour d'Airtable: ${errorData.error?.message || response.statusText}`);
    }
};