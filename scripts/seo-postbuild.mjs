// After `vite build`: prerendered HTML per public page (crawlers and AI assistants read it without
// running JS), structured data, sitemap, robots.txt and llms.txt.
// Only digitalwahl.org is indexable; other builds (staging, white label) get noindex.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_PAGES } from '../src/core/seo-pages.mjs';
import {
  AUDIENCES,
  CHAPTERS,
  MANUAL_STAND,
} from '../src/core/views/staticPages/manual/chapters.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const domain = process.env.DOMAIN || 'digitalwahl.org';
const site = `https://${domain}`;
const indexable = domain === 'digitalwahl.org';
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const pagesDir = path.join(root, 'src/core/views/staticPages');
const esc = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const durations = fs.existsSync(path.join(root, 'public/hilfe/durations.json'))
  ? JSON.parse(fs.readFileSync(path.join(root, 'public/hilfe/durations.json')))
  : {};

// Reduce a Vue template to plain semantic HTML.
export function vueToHtml(source) {
  const body = /<template>([\s\S]*)<\/template>/.exec(source)[1];
  return body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<FaqCard[^>]*?\stitle="([^"]*)"[^>]*>/g, '<h3>$1</h3><div>')
    .replace(/<\/FaqCard>/g, '</div>')
    .replace(/<(img|i|component)\b[^>]*?\/?>(<\/\1>)?/g, '')
    .replace(/<\/?(CorePageLayout|[A-Z][\w-]*)\b[^>]*>/g, '')
    .replace(/<(\w+)(\s[^>]*?)?(\/?)>/g, (_, tag, attrs = '', self) => {
      const href = /\shref="([^"#][^"]*)"/.exec(attrs);
      return `<${tag}${href ? ` href="${href[1]}"` : ''}${self}>`;
    })
    .replace(/\{\{[\s\S]*?\}\}/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

const list = (items) => `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
const manualHtml = () =>
  `<h1>Anleitungen</h1>` +
  AUDIENCES.map(
    (audience) =>
      `<h2>${audience.title}</h2>` +
      CHAPTERS.filter((c) => c.audience === audience.id)
        .map(
          (c) =>
            `<article id="${c.id}"><h3>${esc(c.title)}</h3><p>${esc(c.intro)}</p>` +
            `<ol>${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` +
            `<h4>Was nicht geht</h4>${list(c.limits || [])}<h4>Fallstricke</h4>${list(c.pitfalls || [])}</article>`
        )
        .join('')
  ).join('');

const faqFiles = [
  'GeneralInfo',
  'Registration',
  'Requirements',
  'Execution',
  'Results',
  'Security',
  'Legal',
  'Special',
  'Support',
  'Feedback',
];
const readFaq = (name) => fs.readFileSync(path.join(pagesDir, 'Faq', `${name}.vue`), 'utf8');
const faqHtml = () =>
  `<h1>Häufige Fragen</h1>${faqFiles.map((n) => vueToHtml(readFaq(n))).join('')}`;
const text = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const faqEntities = () =>
  faqFiles.flatMap((name) =>
    [...readFaq(name).matchAll(/<FaqCard[^>]*?\stitle="([^"]*)"[^>]*>([\s\S]*?)<\/FaqCard>/g)].map(
      ([, q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: text(vueToHtml(`<template>${a}</template>`)) },
      })
    )
  );

const organization = {
  '@type': 'Organization',
  '@id': `${site}/#org`,
  name: 'digitalwahl.org',
  url: site,
};
const jsonLd = (route, page) => {
  const url = site + (route === '/' ? '' : route);
  const graph = [organization];
  if (route === '/') {
    graph.push(
      {
        '@type': 'WebSite',
        url: site,
        name: 'digitalwahl.org',
        inLanguage: 'de',
        publisher: { '@id': `${site}/#org` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'digitalwahl.org',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Webbrowser',
        url: site,
        description: page.description,
        provider: { '@id': `${site}/#org` },
      }
    );
  }
  if (page.source === 'faq') graph.push({ '@type': 'FAQPage', url, mainEntity: faqEntities() });
  if (page.source === 'chapters') {
    graph.push({
      '@type': 'TechArticle',
      headline: page.title,
      url,
      inLanguage: 'de',
      dateModified: MANUAL_STAND,
      description: page.description,
      publisher: { '@id': `${site}/#org` },
    });
    for (const c of CHAPTERS) {
      graph.push({
        '@type': 'VideoObject',
        name: c.title,
        description: c.intro,
        thumbnailUrl: `${site}/hilfe/${c.id}.jpg`,
        contentUrl: `${site}/hilfe/${c.id}.mp4`,
        uploadDate: MANUAL_STAND,
        inLanguage: 'de',
        ...(durations[c.id] ? { duration: `PT${durations[c.id]}S` } : {}),
      });
    }
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c'
  );
};

const startHtml = () =>
  `<h1>${esc(SEO_PAGES['/'].title)}</h1><p>${esc(SEO_PAGES['/'].description)}</p>` +
  `<ul><li><a href="/funktionen-planung">Funktionen</a></li><li><a href="/anleitung">Anleitung mit Videos</a></li><li><a href="/haeufige-fragen">Häufige Fragen</a></li><li><a href="/register">Als Organisator registrieren</a></li></ul>`;

const bodyFor = (route, page) => {
  if (route === '/') return startHtml();
  if (page.source === 'chapters') return manualHtml();
  if (page.source === 'faq') return faqHtml();
  return vueToHtml(fs.readFileSync(path.join(pagesDir, page.source), 'utf8'));
};
const robotsMeta = indexable
  ? 'index,follow,max-video-preview:-1,max-snippet:-1'
  : 'noindex,nofollow';
for (const [route, page] of Object.entries(SEO_PAGES)) {
  const url = site + (route === '/' ? '/' : route);
  const title = `${page.title} - digitalwahl.org`;
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${robotsMeta}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="de_DE" />`,
    `<meta property="og:site_name" content="digitalwahl.org" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<script type="application/ld+json">${jsonLd(route, page)}</script>`,
  ].join('\n    ');
  const html = template
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace(/<meta name="robots"[^>]*>\s*/, '')
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace(
      '<div id="app"></div>',
      () => `<div id="app"><main class="container py-4">${bodyFor(route, page)}</main></div>`
    );
  fs.writeFileSync(path.join(dist, `${page.file}.html`), html);
}

const lastmod = MANUAL_STAND;
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    Object.keys(SEO_PAGES)
      .map(
        (route) =>
          `  <url><loc>${site}${route === '/' ? '/' : route}</loc><lastmod>${lastmod}</lastmod></url>`
      )
      .join('\n') +
    `\n</urlset>\n`
);
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  indexable
    ? `User-agent: *\nDisallow: /admin\nDisallow: /event/\nDisallow: /s/\nDisallow: /activate-user/\nDisallow: /graphql\n\nSitemap: ${site}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`
);
fs.writeFileSync(
  path.join(dist, 'llms.txt'),
  `# digitalwahl.org\n\n> ${SEO_PAGES['/'].description}\n\n## Dokumentation\n\n` +
    Object.entries(SEO_PAGES)
      .filter(([route]) => route !== '/')
      .map(([route, page]) => `- [${page.title}](${site}${route}): ${page.description}`)
      .join('\n') +
    `\n- [Vollständige Anleitung als Text](${site}/llms-full.txt)\n`
);
fs.writeFileSync(
  path.join(dist, 'llms-full.txt'),
  `# digitalwahl.org – Anleitung (Stand ${MANUAL_STAND})\n\n` +
    CHAPTERS.map(
      (c) =>
        `## ${c.title}\nVideo: ${site}/hilfe/${c.id}.mp4\n\n${c.intro}\n\nSchritte:\n${c.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWas nicht geht:\n${(c.limits || []).map((s) => `- ${s}`).join('\n')}\n\nFallstricke:\n${(c.pitfalls || []).map((s) => `- ${s}`).join('\n')}\n`
    ).join('\n')
);
// dist/index.html stays as built: the SPA fallback for events and admin carries noindex.
console.log(
  `SEO: ${Object.keys(SEO_PAGES).length} Seiten für ${domain}${indexable ? '' : ' (noindex)'}`
);
