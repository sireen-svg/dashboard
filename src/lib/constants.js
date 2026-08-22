export const FIELD_TYPES = [
  'string',
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'email',
  'url',
  'media',
  'json',
  'enum',
  // Stored as a plain string (the lucide icon name, e.g. "heart-pulse"), but edited
  // through a searchable picker instead of a free-text box. See isIconField in lib/utils.
  'icon',
];

export const RELATION_KINDS = [
  'one-to-one',
  'one-to-many',
  'many-to-many',
];

export const MODULE_KEYS = ['ecommerce', 'booking', 'cms'];

export const MODULE_LABELS = {
  'ecommerce': 'E-commerce',
  'booking': 'Booking',
  'cms': 'CMS',
};
