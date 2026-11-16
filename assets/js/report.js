// Report page: pick "lost" or "found", then the matching Google Form opens below.
// Forms load only when chosen, and the choice is kept in the URL (?type=found).
(function () {
    const FoundIt = window.FoundIt;
    const config = window.FOUNDIT_CONFIG || {};
    const FORMS = { lost: config.lostForm, found: config.foundForm };
    // Embedded Google Forms can't grow to fit, so each frame gets roughly its form's height.
    const HEIGHTS = { lost: 1150, found: 2300 };

    function embedUrl(link) {
        const url = new URL(link);
        url.searchParams.set('embedded', 'true');
        return url.href;
    }

    // Shown instead of a form whose link isn't in config.js yet.
    function comingSoon(frame, type) {
        frame.classList.add('is-loaded');
        const box = document.createElement('div');
        box.className = 'coming-soon';
        box.innerHTML = `
            <div class="coming-soon__art" aria-hidden="true">🛠️</div>
            <h3>This form is almost ready</h3>
            <p></p>
            <a class="btn btn--primary" href="items.html">Browse the board</a>`;
        box.querySelector('p').textContent = type === 'found'
            ? 'Our team is finishing the found-item form. Until then, please keep the item safe or leave it at the front desk of the building where you found it, and check back soon.'
            : 'Our team is finishing this form. Please check back soon.';
        frame.appendChild(box);
    }

    function loadForm(type) {
        const frame = document.querySelector(`[data-form="${type}"]`);
        if (frame.dataset.ready) return;
        frame.dataset.ready = 'true';
        if (!FORMS[type]) {
            comingSoon(frame, type);
            return;
        }
        const iframe = document.createElement('iframe');
        iframe.title = type === 'lost' ? 'Lost item report form' : 'Found item report form';
        iframe.src = embedUrl(FORMS[type]);
        iframe.style.height = `${HEIGHTS[type]}px`;
        iframe.addEventListener('load', () => frame.classList.add('is-loaded'));
        frame.appendChild(iframe);
    }

    function choose(type, scroll) {
        document.querySelectorAll('[data-choice]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.choice === type));
        });
        document.getElementById('lostPanel').hidden = type !== 'lost';
        document.getElementById('foundPanel').hidden = type !== 'found';
        document.getElementById('pickHint').hidden = true;
        loadForm(type);
        history.replaceState(null, '', `${window.location.pathname}?type=${type}`);
        if (scroll) {
            const panel = document.getElementById(`${type}Panel`);
            panel.scrollIntoView({ behavior: FoundIt.reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-choice]').forEach(button => {
            button.addEventListener('click', () => choose(button.dataset.choice, true));
        });
        const type = new URLSearchParams(window.location.search).get('type');
        if (type === 'lost' || type === 'found') choose(type, false);
    });
})();
