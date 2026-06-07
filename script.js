// Dark mode toggle functionality
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    const moonIcon =
        '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>';
    const sunIcon =
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';

    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    html.style.backgroundColor = '';
    html.style.colorScheme = '';
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        html.style.backgroundColor = '';
        html.style.colorScheme = '';
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        }
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode');
    }

})();

// Keep --header-height in sync with the real fixed header (wrapped nav on mobile).
(function() {
    const header = document.querySelector('header');
    if (!header) return;

    function syncHeaderHeight() {
        document.documentElement.style.setProperty(
            '--header-height',
            `${header.getBoundingClientRect().height}px`
        );
    }

    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight, { passive: true });
    if (window.ResizeObserver) {
        new ResizeObserver(syncHeaderHeight).observe(header);
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(syncHeaderHeight);
    }

    window.syncHeaderHeight = syncHeaderHeight;
})();

// Hide header on scroll down, show on scroll up (all pages)
(function() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function showHeader() {
        header.classList.remove('header-hidden');
    }

    function hideHeader() {
        header.classList.add('header-hidden');
    }

    function updateHeaderVisibility() {
        const scrollY = window.scrollY;
        const delta = scrollY - lastScrollY;

        if (scrollY <= 0) {
            showHeader();
        } else if (delta > 8 && scrollY > 72) {
            header.classList.add('header-hidden');
        } else if (delta < -8) {
            showHeader();
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeaderVisibility);
            ticking = true;
        }
    }, { passive: true });

    header.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', showHeader, { passive: true });
    });

    window.showSiteHeader = showHeader;
    window.hideSiteHeader = hideHeader;
    window.syncHeaderScrollState = function(y) {
        lastScrollY = y;
    };
})();

// Homepage: combined scroll view vs focused nav sections
(function() {
    if (!document.body.classList.contains('home')) return;

    const body = document.body;
    const workPanel = document.getElementById('work');
    let suppressRestoreUntil = 0;

    function suppressRestore(ms) {
        suppressRestoreUntil = Math.max(suppressRestoreUntil, Date.now() + ms);
    }

    function canRestoreFromScroll() {
        return Date.now() >= suppressRestoreUntil;
    }

    function setView(mode) {
        body.classList.remove('focus-projects', 'focus-writings');
        if (mode === 'projects') body.classList.add('focus-projects');
        if (mode === 'writings') body.classList.add('focus-writings');
    }

    function headerScrollOffset() {
        if (window.syncHeaderHeight) window.syncHeaderHeight();
        const header = document.querySelector('header');
        return header ? header.getBoundingClientRect().height : 0;
    }

    function cssVarPx(name) {
        const styles = getComputedStyle(document.documentElement);
        const raw = styles.getPropertyValue(name).trim();
        if (!raw || raw === '0' || raw === '0px') return 0;
        if (raw.endsWith('px')) return parseFloat(raw) || 0;
        if (raw.endsWith('rem')) {
            return (parseFloat(raw) || 0) * (parseFloat(styles.fontSize) || 16);
        }
        const probe = document.createElement('div');
        probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${raw}`;
        document.documentElement.appendChild(probe);
        const px = probe.getBoundingClientRect().height;
        probe.remove();
        return px;
    }

    function scrollOffset() {
        return headerScrollOffset() + cssVarPx('--nav-scroll-gap');
    }

    function scrollTargetFor(id) {
        const section = document.getElementById(id);
        if (!section) return null;
        return section.querySelector('h2') || section;
    }

    function scrollTo(el, smooth, options) {
        if (!el) return;

        const opts = options || {};
        const behavior = smooth ? 'smooth' : 'auto';
        const run = () => {
            const offset = opts.ignoreHeader ? (opts.topInset || 0) : scrollOffset();
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: Math.max(0, top), behavior });

            const finalize = () => {
                if (window.syncHeaderScrollState) {
                    window.syncHeaderScrollState(window.scrollY);
                }
            };

            if (behavior === 'auto') {
                function alignScrollTarget(attemptsLeft) {
                    const targetOffset = opts.ignoreHeader ? (opts.topInset || 0) : scrollOffset();
                    const gap = el.getBoundingClientRect().top - targetOffset;
                    if (Math.abs(gap) > 1) {
                        window.scrollBy({ top: gap, behavior: 'auto' });
                    }
                    if (attemptsLeft > 0) {
                        requestAnimationFrame(() => alignScrollTarget(attemptsLeft - 1));
                    } else {
                        finalize();
                    }
                }
                requestAnimationFrame(() => alignScrollTarget(2));
            } else if ('onscrollend' in window) {
                window.addEventListener('scrollend', finalize, { once: true });
            } else {
                setTimeout(finalize, 700);
            }
        };

        // Wait for focus-mode display changes to settle before measuring scroll position.
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(run)));
    }

    function navigate(id, options) {
        const opts = options || {};
        const updateHistory = opts.updateHistory !== false;
        const isFocusedSection = id === 'projects' || id === 'writings';
        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        const smooth = opts.smooth !== false && !(isMobile && isFocusedSection);

        if (isFocusedSection) {
            suppressRestore(smooth ? 1200 : 200);
        }

        if (id === 'projects') {
            if (updateHistory) history.pushState(null, '', '#projects');
            setView('projects');
            if (window.showSiteHeader) window.showSiteHeader();
            scrollTo(scrollTargetFor('projects'), smooth);
        } else if (id === 'writings') {
            if (updateHistory) history.pushState(null, '', '#writings');
            setView('writings');
            if (window.showSiteHeader) window.showSiteHeader();
            scrollTo(scrollTargetFor('writings'), smooth);
        } else if (id === 'work') {
            if (updateHistory) history.pushState(null, '', '#work');
            setView('combined');
            if (window.hideSiteHeader) window.hideSiteHeader();
            scrollTo(workPanel, smooth, { ignoreHeader: true });
        } else if (id === 'landing') {
            if (updateHistory) history.pushState(null, '', '#landing');
            if (window.showSiteHeader) window.showSiteHeader();
            if (isMobile) {
                setView('combined');
            }
            scrollTo(document.getElementById('landing'), smooth);
        }
    }

    function restoreCombinedView() {
        if (!canRestoreFromScroll()) return;
        if (!body.classList.contains('focus-projects') && !body.classList.contains('focus-writings')) {
            return;
        }
        setView('combined');
        if (location.hash === '#projects' || location.hash === '#writings') {
            history.replaceState(null, '', '#landing');
        }
    }

    const scrollCue = document.querySelector('.scroll-cue');
    if (scrollCue && workPanel) {
        let scrollCueWasHidden = scrollCue.classList.contains('is-hidden');

        const workObserver = new IntersectionObserver(
            ([entry]) => {
                const workVisible = entry.isIntersecting;
                const nowHidden = workVisible;

                if (scrollCueWasHidden && !nowHidden) {
                    restoreCombinedView();
                }
                scrollCueWasHidden = nowHidden;

                scrollCue.classList.toggle('is-hidden', nowHidden);
                scrollCue.setAttribute('aria-hidden', nowHidden ? 'true' : 'false');
            },
            { threshold: 0.05 }
        );
        workObserver.observe(workPanel);
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        if (id !== 'work' && !document.getElementById(id)) return;

        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigate(id);
        });
    });

    window.addEventListener('popstate', function() {
        const id = location.hash.replace('#', '') || 'landing';
        if (id === 'projects' || id === 'writings' || id === 'work' || id === 'landing') {
            navigate(id, { updateHistory: false, smooth: false });
        }
    });

    const initial = location.hash.replace('#', '');
    if (initial === 'projects' || initial === 'writings' || initial === 'work' || initial === 'landing') {
        navigate(initial, { updateHistory: false, smooth: false });
    }
})();

// Article reading progress (writing pages)
(function() {
    const progress = document.querySelector('.reading-progress');
    const bar = progress && progress.querySelector('.reading-progress-bar');
    if (!progress || !bar || !document.querySelector('.writing-page')) return;

    document.documentElement.prepend(progress);

    function syncProgressTop() {
        const top = window.visualViewport ? window.visualViewport.offsetTop : 0;
        progress.style.top = `${top}px`;
    }

    function updateProgress() {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        const p = max <= 0 ? 1 : window.scrollY / max;
        bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
    }

    function onUpdate() {
        syncProgressTop();
        updateProgress();
    }

    window.addEventListener('scroll', onUpdate, { passive: true });
    window.addEventListener('resize', onUpdate, { passive: true });
    if (window.visualViewport) {
        window.visualViewport.addEventListener('scroll', syncProgressTop, { passive: true });
        window.visualViewport.addEventListener('resize', onUpdate, { passive: true });
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(onUpdate);
    }
    onUpdate();
})();

// Copyable heading anchors on writing pages
(function() {
    const content = document.querySelector('.writing-content');
    if (!content) return;

    content.querySelectorAll('h2[id], h3[id], h4[id]').forEach(heading => {
        heading.style.cursor = 'pointer';

        heading.addEventListener('click', function() {
            const url = window.location.origin + window.location.pathname + '#' + this.id;
            history.replaceState(null, '', '#' + this.id);

            function showFeedback() {
                heading.classList.remove('fade-out', 'copied');
                void heading.offsetWidth;
                heading.classList.add('copied');
                setTimeout(() => heading.classList.add('fade-out'), 800);
                setTimeout(() => heading.classList.remove('copied', 'fade-out'), 1400);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(showFeedback, showFeedback);
            } else {
                showFeedback();
            }
        });
    });
})();
