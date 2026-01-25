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

// Smooth scroll for navigation links
(function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();
