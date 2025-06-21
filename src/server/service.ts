interface allDataObject {
    id: number;
    value: string;
}

let allData: Array<allDataObject> = [];
let selectedIds: Set<number> = new Set();
let savedSearchQuery: string = '';
let savedCustomOrder: number[] = [];

export async function ClientInfoServiceGet(page: number = 0, pageSize: number = 20, search: any = '', order: number[] = []): Promise<any> {
    if (allData.length === 0) { // NOTE generates all data for the frotend
        for (let i = 1; i <= 1000000; i++) { // algo that makes from 1 to 1000000
            allData.push({ id: i, value: `${i}` });
        }
    }

    // if search/order not passed - using the saved one
    if (!search && savedSearchQuery) search = savedSearchQuery;
    if ((!order || order.length === 0) && savedCustomOrder.length > 0) order = savedCustomOrder;

    let filtered = allData;
    if (search) {
        const query = search.toLowerCase();
        filtered = allData.filter(
            item =>
                item.value.toLowerCase().includes(query) ||
                item.id.toString().includes(query)
        );
    }

    if (order && order.length > 0) { // voodoo algos, please forgive
        const orderMap = Object.fromEntries(order.map((id, idx) => [id, idx]));
        filtered = [...filtered].sort((a, b) => {
            const aOrder = orderMap[a.id] ?? Infinity;
            const bOrder = orderMap[b.id] ?? Infinity;
            if (aOrder === bOrder) return a.id - b.id;
            return aOrder - bOrder;
        });
    }

    const start = page * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    return { // return all required info for the get request to frontend
        pageData,
        total: filtered.length,
        selectedIds: Array.from(selectedIds),
        customOrder: order,
        searchQuery: search,
    };
}

export async function ClientInfoServicePost(body: any): Promise<{ ok: boolean }> {
    if (!body) return { ok: false }; // basic error handler for client
    selectedIds = new Set(body.selectedIds || []);
    savedCustomOrder = body.customOrder || [];
    savedSearchQuery = body.searchQuery || '';
    return { ok: true };
}