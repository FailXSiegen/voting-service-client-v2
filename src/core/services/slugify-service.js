/**
 * @param  {string} subject
 * @returns {string}
 */
export function slugify(subject) {
    return subject
        .trim()
        .replace(/[^a-zA-Z0-9\- ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--/g, '')
        .toLowerCase();
}