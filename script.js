// Dark mode toggle functionality
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Moon icon SVG path (doodle style - proper crescent)
    const moonPath = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: url(#rough-icon);"></path>`;
    
    // Sun icon SVG paths (doodle style - simple sun)
    const sunPaths = `<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: url(#rough-icon);"></circle>
        <path d="M12 1.5l0 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M12 20.5l0 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M4.2 4.2l1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M18 18l1.8 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M1.5 12l2.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M20.5 12l2.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M4.2 19.8l1.8 -1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>
        <path d="M18 6l1.8 -1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="filter: url(#rough-icon);"></path>`;

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    // Toggle theme on button click
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.innerHTML = sunPaths;
                themeIcon.setAttribute('style', 'filter: url(#rough-icon);');
            } else {
                themeIcon.innerHTML = moonPath;
                themeIcon.setAttribute('style', 'filter: url(#rough-icon);');
            }
        }
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Toggle light mode' : 'Toggle dark mode');
    }

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
