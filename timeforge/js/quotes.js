/* ============================================
   TimeForge — Motivational Quotes
   Random display, hourly rotation, favorites
   ============================================ */

const Quotes = (() => {
    let rotationTimer = null;

    /** Get a random active quote */
    function getRandom() {
        const quotes = Store.getQuotes().filter(q => q.active);
        if (quotes.length === 0) return null;
        // Rotate based on hour to keep consistent within an hour
        const hourSeed = Math.floor(Date.now() / 3600000);
        const idx = hourSeed % quotes.length;
        return quotes[idx];
    }

    /** Render a quote card (for dashboard and timer) */
    function renderQuoteCard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const user = Store.getCurrentUser();
        const quote = getRandom();
        if (!quote) {
            container.innerHTML = '';
            return;
        }

        const lang = I18n.getLang();
        const text = lang === 'lv' ? quote.textLv : quote.textEn;
        const favs = user ? Store.getFavoriteQuotes(user.id) : [];
        const isFav = favs.includes(quote.id);

        container.innerHTML = `
            <div class="quote-card">
                <p class="quote-text">${Utils.escapeHtml(text)}</p>
                <span class="quote-author">— ${Utils.escapeHtml(quote.author)}</span>
                <div class="quote-actions">
                    <button class="quote-fav-btn ${isFav ? 'active' : ''}" data-quote-id="${quote.id}" title="${isFav ? '★' : '☆'}">
                        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        container.querySelector('.quote-fav-btn')?.addEventListener('click', function() {
            if (!user) return;
            const added = Store.toggleFavoriteQuote(user.id, quote.id);
            this.classList.toggle('active', added);
            this.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
            Toast.info(added ? '❤️' : '💔', added
                ? (lang === 'lv' ? 'Pievienots favorītiem' : 'Added to favorites')
                : (lang === 'lv' ? 'Noņemts no favorītiem' : 'Removed from favorites')
            );
        });
    }

    /** Render quote for timer sidebar */
    function renderTimerQuote(container) {
        const quote = getRandom();
        if (!quote || !container) return;
        const lang = I18n.getLang();
        const text = lang === 'lv' ? quote.textLv : quote.textEn;
        container.innerHTML = `
            <div class="timer-quote">
                "${Utils.escapeHtml(text)}"
                <span class="tq-author">— ${Utils.escapeHtml(quote.author)}</span>
            </div>
        `;
    }

    /** Start hourly rotation */
    function startRotation() {
        if (rotationTimer) clearInterval(rotationTimer);
        rotationTimer = setInterval(() => {
            renderQuoteCard('dashboard-quote');
        }, 3600000); // 1 hour
    }

    function stopRotation() {
        if (rotationTimer) clearInterval(rotationTimer);
    }

    return { getRandom, renderQuoteCard, renderTimerQuote, startRotation, stopRotation };
})();
