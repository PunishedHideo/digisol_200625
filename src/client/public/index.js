// globals. might not be safe
// const api = '127.0.0.1:3000/api'

// TODO It will take time to get it good
// so either way it is test so let it slide

// NOTE These global variables were the part of unoptimized stuff and were banished from existence
// let allData; // TODO get all data from backend
// let filteredData; // array

let displayedData; // array
let selectedIds = new Set(); // set
let customOrder; // array
// to this - store in the backend - and then retrieve and stuff
let currentPage = 0; // number - default 0 but 1 after loading
let searchQuery = ''; // string - default ''
// basically simple stateful thing

let isLoading = false;

// NOTE DEBOUNCER FOR DATA STORING
let storeTimeout;
function debouncedStoreData() {
    clearTimeout(storeTimeout);
    storeTimeout = setTimeout(storeData, 500);
}

// NOTE test data - Either make an api call to backend to get data or just get it with get / route
async function getData(page = 0, pageSize = 20) {
    const params = new URLSearchParams({
        page: page,
        pageSize: pageSize,
        search: searchQuery,
        order: JSON.stringify(customOrder || [])
    });
    const response = await (await fetch(`api/client-info?${params.toString()}`)).json();
    if (page === 0) {
        selectedIds = new Set(response.selectedIds || []);
        customOrder = response.customOrder || [];
        // Восстанавливаем searchQuery из ответа сервера
        if (typeof response.searchQuery === 'string') {
            searchQuery = response.searchQuery;
        }
    }
    return response;
}

async function storeData() {
    await fetch('api/client-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            selectedIds: Array.from(selectedIds),
            customOrder,
            searchQuery,
            currentPage,
        })
    });
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingDiv');
    if (show) {
        loadingDiv.textContent = 'Loading...';
        loadingDiv.style.display = 'block';
    } else {
        if (displayedData.length >= totalCount) {
            loadingDiv.textContent = 'All Data Loaded!';
            loadingDiv.style.display = 'block';
        } else {
            loadingDiv.style.display = 'none';
        }
    }
}

function renderTable() { // shows the api output
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    displayedData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.draggable = true;
        row.dataset.id = item.id;
        row.dataset.index = index;
        
        if (selectedIds.has(item.id)) {
            row.classList.add('selected');
        }
        
        // NOTE not sure if this is safe
        row.innerHTML = `
            <td class="check-col">
                <input type="checkbox" class="checkbox" ${selectedIds.has(item.id) ? 'checked' : ''}>
            </td>
            <td class="handle-col">
                <span class="drag-handle">≡</span>
            </td>
            <td class="id-col">${item.id}</td>
            <td>${item.value}</td>
        `;
        
        const checkbox = row.querySelector('.checkbox');
        checkbox.addEventListener('change', () => toggleSelect(item.id));
        
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
        row.addEventListener('dragleave', handleDragLeave);
        
        tbody.appendChild(row);
    });
    
    if (displayedData.length < totalCount && !isLoading) {
        const loadMoreRow = document.createElement('tr');

        // NOTE not sure if this is safe either
        loadMoreRow.innerHTML = `
            <td colspan="4" class="load-more-row">
                <button class="load-more-btn">Загрузить еще</button>
            </td>
        `;
        
        const btn = loadMoreRow.querySelector('.load-more-btn');
        btn.addEventListener('click', loadMoreData);
        
        tbody.appendChild(loadMoreRow);
    }
    
    updateCounters();
}

function updateCounters() {
    document.getElementById('selectedCount').textContent = selectedIds.size;
    document.getElementById('shownCount').textContent = displayedData.length;
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const visibleIds = displayedData.map(item => item.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    selectAllCheckbox.checked = allVisibleSelected && visibleIds.length > 0;
}

function toggleSelect(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
        const checkbox = row.querySelector('.checkbox');
        if (selectedIds.has(id)) {
            row.classList.add('selected');
            checkbox.checked = true;
        } else {
            row.classList.remove('selected');
            checkbox.checked = false;
        }
    }
    
    updateCounters();
    debouncedStoreData();
}

function selectAll() { // select all button responsible
    displayedData.forEach(item => {
        selectedIds.add(item.id);
    });
    renderTable();
    debouncedStoreData();
}

function deselectAll() { // deselect button responsible
    displayedData.forEach(item => {
        selectedIds.delete(item.id);
    });
    renderTable();
    debouncedStoreData();
}

function toggleSelectAll() { // select all checkbox
    const checkbox = document.getElementById('selectAllCheckbox');
    if (checkbox.checked) {
        selectAll();
    } else {
        deselectAll();
    }
}

let draggedElement = null;

// NOTE D&D STUFF BEGINGS. voodoo to be honest, idk how it works
function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drop-target');
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    if (this === draggedElement) return;
    
    const rows = Array.from(document.querySelectorAll('#tableBody tr[data-id]'));
    rows.forEach(row => row.classList.remove('drop-target'));
    const draggedIndex = parseInt(draggedElement.dataset.index);
    const targetIndex = parseInt(this.dataset.index);
    
    if (isNaN(draggedIndex) || isNaN(targetIndex)) return;
    
    const movedItem = displayedData.splice(draggedIndex, 1)[0];
    displayedData.splice(targetIndex, 0, movedItem);
    customOrder = displayedData.map(item => item.id);
    
    renderTable();
    debouncedStoreData();
}

function handleDragEnd(e) {
    if (this) {
        this.classList.remove('dragging');
    }
    
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    rows.forEach(row => row.classList.remove('drop-target'));
    
    draggedElement = null;
}

function handleSearch() {
    const newQuery = document.getElementById('searchInput').value;
    if (newQuery === searchQuery) return;

    searchQuery = newQuery;
    currentPage = 0;
    displayedData = [];
    totalCount = 0;
    isLoading = false;
    loadMoreData();
    debouncedStoreData();
}
// d&d STUFF END

function resetData() {
    currentPage = 0;
    displayedData = [];
    isLoading = false;
}

let totalCount = 0; // not sure if safe keeping it global but idk it is convenient

async function loadMoreData() { // NOTE loads data for each page from the backend
    if (isLoading) return;

    isLoading = true;
    showLoading(true);

    const response = await getData(currentPage, 20);
    const newItems = response.pageData;

    const existingIds = new Set(displayedData.map(item => item.id));
    const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));

    displayedData = [...displayedData, ...uniqueNewItems];
    totalCount = response.total;

    renderTable();
    currentPage++;
    isLoading = false;
    showLoading(false);
}

async function init() {
    displayedData = [];
    currentPage = 0;
    isLoading = false;
    totalCount = 0;

    // lazy loads the FIRST page from the backend
    const response = await getData(0, 20);
    const searchInput = document.getElementById('searchInput');
    searchInput.value = searchQuery;

    // adds the retrivied first page data to the displayed data
    displayedData = response.pageData || [];
    totalCount = response.total || 0;
    renderTable();

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });

    document.getElementById('selectAllBtn').addEventListener('click', selectAll);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
    document.getElementById('selectAllCheckbox').addEventListener('change', toggleSelectAll);

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
                if (!isLoading && displayedData.length < totalCount) {
                    loadMoreData();
                }
            }
        }, 100);
    });

    window.addEventListener('beforeunload', () => {
        navigator.sendBeacon('api/client-info', JSON.stringify({ // NO CLUE WHAT THIS DOES!
            selectedIds: Array.from(selectedIds),
            customOrder,
            searchQuery,
            currentPage,
        }));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}