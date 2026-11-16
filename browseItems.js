const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSk_olPna8hpfvpOYkJm2DpirhrvF13S6AmL_1rGkoXNbBXeWkIwPttmy97hxM4DzaLGP-vbDxaRa8u/pub?gid=1959645353&single=true&output=csv";

// Labels used when the sheet's header row doesn't name a column.
const fallbackLabels = ['Date', 'Item', 'Description', 'Location'];

// Splits CSV text into rows of fields, handling quoted fields that contain
// commas, line breaks, or escaped quotes ("") the way Google Sheets exports them.
function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                field += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

// Finds a column by its header text, so the filters keep working if the
// form's questions get reordered. Falls back to the usual position.
function findColumn(headers, pattern, fallbackIndex) {
    const index = headers.findIndex(header => pattern.test(header.trim()));
    return index === -1 ? fallbackIndex : index;
}

// Reads dates the way Google Sheets exports them (11/7/2026, with or without a
// time after it) and the YYYY-MM-DD values that date inputs give. Returns null otherwise.
function parseDate(text) {
    const value = (text || '').trim();

    let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return new Date(Number(match[1]), match[2] - 1, Number(match[3]));

    match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) return new Date(Number(match[3]), match[1] - 1, Number(match[2]));

    return null;
}

function loadLostItems() {
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
            return response.text();
        })
        .then(data => {
            const [headers = [], ...rows] = parseCSV(data);
            const lostItemsContainer = document.getElementById('lostItems');
            const items = [];
            rows.forEach(cols => {
                if (!cols.some(col => col.trim())) return; // skip blank lines so they don't show as "undefined"

                const itemRow = document.createElement('tr');
                itemRow.classList.add('lost-item');
                itemRow.tabIndex = 0;
                itemRow.setAttribute('role', 'button');
                itemRow.setAttribute('aria-label', `View details for ${cols[1] || 'this item'}`);

                for (let i = 0; i < 4; i++) {
                    const cell = document.createElement('td');
                    cell.textContent = cols[i] || '';
                    itemRow.appendChild(cell);
                }

                itemRow.addEventListener('click', () => openItemModal(headers, cols));
                itemRow.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openItemModal(headers, cols);
                    }
                });

                lostItemsContainer.appendChild(itemRow);
                items.push({ cols, row: itemRow });
            });

            setUpFilters(headers, items);
        })
        .catch(error => {
            console.error(error);
            document.getElementById('filterStatus').textContent =
                "Couldn't load items. Please refresh the page to try again.";
        });
}

// Splits a search box's text into lowercase words.
function searchWords(text) {
    return text.toLowerCase().split(/\s+/).filter(Boolean);
}

// Hooks up the What / Where / When filters above the table. Rows that don't
// match are taken out of the table and put back in their original order when
// they match again, so the striped rows stay even.
function setUpFilters(headers, items) {
    const form = document.getElementById('itemFilters');
    const whatInput = document.getElementById('filterWhat');
    const whereInput = document.getElementById('filterWhere');
    const fromInput = document.getElementById('filterFrom');
    const toInput = document.getElementById('filterTo');
    const status = document.getElementById('filterStatus');
    const table = document.getElementById('lostItems');

    const itemColumn = findColumn(headers, /^item$/i, 1);
    const descriptionColumn = findColumn(headers, /description/i, 2);
    const locationColumn = findColumn(headers, /location/i, 3);
    // "Date Lost" is when the item went missing; the timestamp is only when it was reported.
    const dateColumn = findColumn(headers, /^date/i, 0);

    // Suggest the places people have already typed, so "Where" is quick to fill in.
    const locationOptions = document.getElementById('locationOptions');
    const locations = new Set(items.map(({ cols }) => (cols[locationColumn] || '').trim()).filter(Boolean));
    [...locations].sort().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        locationOptions.appendChild(option);
    });

    const noResultsRow = document.createElement('tr');
    noResultsRow.className = 'no-results-row';
    const noResultsCell = document.createElement('td');
    noResultsCell.colSpan = 4;
    noResultsCell.textContent = 'No items match your filters. Try fewer words or a wider date range.';
    noResultsRow.appendChild(noResultsCell);

    function applyFilters() {
        const whatWords = searchWords(whatInput.value);
        const whereWords = searchWords(whereInput.value);
        let from = parseDate(fromInput.value);
        let to = parseDate(toInput.value);
        if (from && to && from > to) [from, to] = [to, from];

        let shown = 0;
        items.forEach(({ cols, row }) => {
            const what = `${cols[itemColumn] || ''} ${cols[descriptionColumn] || ''}`.toLowerCase();
            const where = (cols[locationColumn] || '').toLowerCase();
            const date = parseDate(cols[dateColumn]) || parseDate(cols[0]);

            const matches = whatWords.every(word => what.includes(word)) &&
                whereWords.every(word => where.includes(word)) &&
                (!from || (date && date >= from)) &&
                (!to || (date && date <= to));

            if (matches) {
                table.appendChild(row);
                shown++;
            } else {
                row.remove();
            }
        });

        if (shown || !items.length) {
            noResultsRow.remove();
        } else {
            table.appendChild(noResultsRow);
        }

        status.textContent = items.length
            ? `Showing ${shown} of ${items.length} item${items.length === 1 ? '' : 's'}`
            : 'No items have been reported yet.';
    }

    form.addEventListener('input', applyFilters);
    form.addEventListener('submit', event => event.preventDefault());
    // The reset event fires before the boxes are cleared, so filter again right after it.
    form.addEventListener('reset', () => setTimeout(applyFilters));

    applyFilters();
}

// Fills the modal with every column the sheet has for this item, so any
// extra details beyond the four table columns show up here too.
function openItemModal(headers, cols) {
    const modal = document.getElementById('itemModal');
    const details = document.getElementById('itemModalDetails');

    document.getElementById('itemModalTitle').textContent = cols[1] || 'Item details';
    details.replaceChildren();

    cols.forEach((value, i) => {
        if (i === 1 || !value.trim()) return; // item name is already the title
        const label = document.createElement('dt');
        label.textContent = (headers[i] && headers[i].trim()) || fallbackLabels[i] || `Detail ${i + 1}`;
        const content = document.createElement('dd');
        content.textContent = value.trim();
        details.append(label, content);
    });

    modal.showModal();
    document.body.classList.add('modal-open');
}

function setUpItemModal() {
    const modal = document.getElementById('itemModal');

    modal.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => modal.close());
    });

    // A click that lands on the dialog itself (not its content) is a backdrop click.
    modal.addEventListener('click', event => {
        if (event.target === modal) modal.close();
    });

    // Escape is handled by the browser for <dialog>; this just restores page scrolling.
    modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
}

document.addEventListener('DOMContentLoaded', () => {
    setUpItemModal();
    loadLostItems();
});
