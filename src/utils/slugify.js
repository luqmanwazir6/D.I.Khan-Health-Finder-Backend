/**
 * Slugify a string into a URL-friendly slug.
 *
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing -
}

/**
 * Generates a unique slug for a given Mongoose Model.
 *
 * @param {import('mongoose').Model} Model
 * @param {string} baseText
 * @param {string} [currentId] - Exclude current document ID when updating
 * @returns {Promise<string>}
 */
export async function generateUniqueSlug(Model, baseText, currentId = null) {
  const baseSlug = slugify(baseText) || 'item';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const exists = await Model.findOne(query).select('_id').lean();
    if (!exists) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export default {
  slugify,
  generateUniqueSlug
};
