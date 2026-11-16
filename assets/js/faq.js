// FAQ: the search box hides questions that don't match and opens the ones that do.
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('faqSearch');
        const items = [...document.querySelectorAll('.faq-item')];
        const empty = document.getElementById('faqEmpty');

        input.addEventListener('input', () => {
            const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
            let shown = 0;
            items.forEach(item => {
                const match = terms.every(term => item.textContent.toLowerCase().includes(term));
                item.hidden = !match;
                if (terms.length) item.open = match;
                if (match) shown++;
            });
            empty.hidden = shown > 0;
        });
    });
})();
