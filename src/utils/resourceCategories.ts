import type { Resource } from '../data/models.ts';

/** Keep Admin category counts and Browse filters on the same catalog and rules. */
export const matchesBrowseCategory = (resource: Resource, categoryName: string): boolean => {
  const category = categoryName.trim().toLowerCase();
  if (category === 'all') return true;
  if (category === 'video lessons') return resource.type === 'Video link' || resource.fileFormat === 'VIDEO';
  if (category === 'pdf notes') return resource.fileFormat === 'PDF' && resource.type !== 'Past Paper';
  if (category === 'past papers') return resource.type === 'Past Paper';
  return String(resource.category || '').trim().toLowerCase() === category;
};
