// globals. might not be safe
// const api = '127.0.0.1:3000/api'

let allData; // TODO get all data from backend

// TODO from this
let filteredData; // array
let displayedData; // array
let selectedIds; // set
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
async function getData() {
    const response = await (await fetch(`api/client-info`)).json()

    allData = response.allData
    filteredData = response.filteredData || [...allData];
    displayedData = response.displayedData || []
    selectedIds = new Set(response.selectedIds || response.selectedIdsArray || [])
    customOrder = response.customOrder || []
    
    console.log('Loading status check:', {
        allData: allData?.length,
        filteredData: filteredData?.length,
        displayedData: displayedData?.length,
        selectedIds: selectedIds?.size,
        customOrder: customOrder?.length
    });
}

async function storeData() {
    const selectedIdsArray = Array.from(selectedIds)

    const request = await fetch('api/client-info', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        filteredData,
        displayedData,
        selectedIdsArray,
        customOrder
    })
});
}

function filterData() {
    if (!searchQuery.trim()) {
        filteredData = [...allData];
    } else {
        const query = searchQuery.toLowerCase().trim();
        filteredData = allData.filter(item => 
            item.value.toLowerCase().includes(query) || 
            item.id.toString().includes(query)
        );
    }
    
    if (customOrder.length > 0) { // custom sorting
        const orderMap = {};
        customOrder.forEach((id, index) => {
            orderMap[id] = index;
        });
        
        filteredData.sort((a, b) => {
            const aOrder = orderMap[a.id] !== undefined ? orderMap[a.id] : Infinity;
            const bOrder = orderMap[b.id] !== undefined ? orderMap[b.id] : Infinity;
            if (aOrder === bOrder) {
                return a.id - b.id;
            }
            return aOrder - bOrder;
        });
    }
}

function loadMoreData() { // scrolling data loader
    if (isLoading) return;
    
    const startIndex = currentPage * 20;
    if (startIndex >= filteredData.length) return;
    
    isLoading = true;
    showLoading(true);
    
    setTimeout(() => {
        const endIndex = Math.min(startIndex + 20, filteredData.length);
        const newItems = filteredData.slice(startIndex, endIndex);
        
        if (currentPage === 0) {
            displayedData = [...newItems];
        } else {
            displayedData = [...displayedData, ...newItems];
        }
        
        renderTable();
        currentPage++;
        isLoading = false;
        showLoading(false);
        
        debouncedStoreData();
    }, 200);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingDiv');
    if (show) {
        loadingDiv.textContent = 'Loading...';
        loadingDiv.style.display = 'block';
    } else {
        if (displayedData.length >= filteredData.length) {
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
    
    if (displayedData.length < filteredData.length && !isLoading) {
        const loadMoreRow = document.createElement('tr');
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

function selectAll() {
    displayedData.forEach(item => {
        selectedIds.add(item.id);
    });
    renderTable();
    debouncedStoreData();
}

function deselectAll() {
    displayedData.forEach(item => {
        selectedIds.delete(item.id);
    });
    renderTable();
    debouncedStoreData();
}

function toggleSelectAll() {
    const checkbox = document.getElementById('selectAllCheckbox');
    if (checkbox.checked) {
        selectAll();
    } else {
        deselectAll();
    }
}

let draggedElement = null;

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
    filterData();
    loadMoreData();
    debouncedStoreData();
}

function resetData() {
    currentPage = 0;
    displayedData = [];
    isLoading = false;
}

async function init() { // NOTE initializes before rendering the table
    // this thing right here is like what will happen if the program just recieved first get request for /
    // but I guess it is not really necessary because backend does the same thing iirc
    await getData();
    
    // NOTE searchbar restorer(not working right now I suppose)
    document.getElementById('searchInput').value = searchQuery;
    
    if (displayedData.length > 0) {
        displayedData = displayedData.slice(0, 20);
        currentPage = 1;
        
        renderTable();
        showLoading(false);
    } else {
        // no data saved - normal loading smth smth
        filterData();
        loadMoreData();
    }
    
    const searchInput = document.getElementById('searchInput');
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
                if (displayedData.length < filteredData.length && !isLoading) {
                    loadMoreData();
                }
            }
        }, 100);
    });
    
    window.addEventListener('beforeunload', () => {
        navigator.sendBeacon('api/client-info', JSON.stringify({
            filteredData,
            displayedData,
            selectedIdsArray: Array.from(selectedIds),
            customOrder,
            currentPage,
            searchQuery
        }));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}