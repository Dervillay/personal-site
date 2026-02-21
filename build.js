const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function slugify(text) {
    return text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const renderer = new marked.Renderer();
renderer.heading = function({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};
marked.setOptions({ renderer });

const CONTENT_DIR = path.join(__dirname, 'content');
const WRITINGS_DIR = path.join(__dirname, 'writings');
const INDEX_PATH = path.join(__dirname, 'index.html');

// ---------------------------------------------------------------------------
// Writing page template – matches the existing site chrome exactly
// ---------------------------------------------------------------------------
function readingTime(text) {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 230));
    return `${minutes} min read`;
}

function writingPageTemplate({ title, date, readTime, contentHtml }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Writing by James GB">
    <title>${escapeHtml(title)} - James GB</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
    <svg style="position: absolute; width: 0; height: 0;">
        <defs>
            <filter id="rough-icon" x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="2" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8"/>
            </filter>
        </defs>
    </svg>
</head>
<body>
    <header>
        <nav>
            <a href="../index.html" class="site-title">James GB</a>
            <div class="nav-right">
                <div class="nav-links">
                    <a href="../index.html#projects" class="nav-link">Projects</a>
                    <a href="../index.html#writings" class="nav-link">Things I've Written</a>
                </div>
                <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
                    <svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none"></path>
                    </svg>
                </button>
            </div>
        </nav>
    </header>

    <main>
        <article class="writing-page">
            <h1>${escapeHtml(title)}</h1>
            <div class="writing-meta">
                <time class="writing-date">${escapeHtml(date)}</time>
                <span class="writing-reading-time">${readTime}</span>
            </div>
            <div class="writing-content">
                ${contentHtml}
            </div>
        </article>
    </main>

    <footer/>

    <script src="../script.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(dateValue) {
    // Accept a Date object or string like "2026-01-25"
    const d = new Date(dateValue);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateWritingsListHtml(writings) {
    return writings.map(w => `                <article class="writing">
                    <time class="writing-date">${escapeHtml(w.date)}</time>
                    <h3><a href="writings/${w.slug}.html" class="writing-link">${escapeHtml(w.title)}</a></h3>
                    <p class="writing-excerpt">
                        ${escapeHtml(w.excerpt)}
                    </p>
                </article>`).join('\n');
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------
function build() {
    console.log('Building writings...\n');

    // Clear and recreate output directory
    if (fs.existsSync(WRITINGS_DIR)) {
        fs.rmSync(WRITINGS_DIR, { recursive: true });
    }
    fs.mkdirSync(WRITINGS_DIR, { recursive: true });

    // Read all markdown files
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

    if (files.length === 0) {
        console.log('No .md files found in content/');
        return;
    }

    const writings = [];

    for (const file of files) {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        const { data, content } = matter(raw);

        if (!data.title || !data.date) {
            console.warn(`  ⚠ Skipping ${file} – missing required front matter (title, date)`);
            continue;
        }

        const contentHtml = marked(content);
        const slug = path.basename(file, '.md');
        const date = formatDate(data.date);
        const readTime = readingTime(content);

        writings.push({
            title: data.title,
            date,
            excerpt: data.excerpt || '',
            slug,
        });

        const pageHtml = writingPageTemplate({ title: data.title, date, readTime, contentHtml });
        fs.writeFileSync(path.join(WRITINGS_DIR, `${slug}.html`), pageHtml);
        console.log(`  ✓ writings/${slug}.html`);
    }

    // Sort by date descending (newest first)
    writings.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update the writings list in index.html
    const indexHtml = fs.readFileSync(INDEX_PATH, 'utf-8');
    const startMarker = '<!-- WRITINGS:START -->';
    const endMarker = '<!-- WRITINGS:END -->';

    const startIdx = indexHtml.indexOf(startMarker);
    const endIdx = indexHtml.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
        console.warn('\n  ⚠ Could not find WRITINGS markers in index.html – skipping index update.');
        console.warn('    Make sure index.html contains <!-- WRITINGS:START --> and <!-- WRITINGS:END -->');
    } else {
        const before = indexHtml.slice(0, startIdx + startMarker.length);
        const after = indexHtml.slice(endIdx);
        const newIndexHtml = before + '\n' + generateWritingsListHtml(writings) + '\n                ' + after;
        fs.writeFileSync(INDEX_PATH, newIndexHtml);
        console.log('  ✓ index.html writings list updated');
    }

    console.log(`\nDone! Built ${writings.length} writing(s).`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
build();

if (process.argv.includes('--watch')) {
    console.log(`\nWatching content/ for changes...\n`);

    let debounce = null;
    fs.watch(CONTENT_DIR, (_event, filename) => {
        if (!filename || !filename.endsWith('.md')) return;
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            console.log(`\n--- ${filename} changed ---\n`);
            build();
        }, 100);
    });
}