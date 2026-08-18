import {
  CLINIC_CONTENT_TYPES,
  CLINIC_RELATIONS,
  CLINIC_STARTER_ENTRIES,
} from '../src/data/clinicTemplates.js';

const projectId = Number(process.env.CLINIC_PROJECT_ID || 1);
if (!Number.isInteger(projectId) || projectId < 1) {
  throw new Error('CLINIC_PROJECT_ID must be a positive numeric CMS project id.');
}

const quote = (value) => `'${String(value ?? '').replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
const json = (value) => quote(JSON.stringify(value ?? {}));
const lines = [
  'SET NAMES utf8mb4;',
  'START TRANSACTION;',
];

for (const type of CLINIC_CONTENT_TYPES) {
  lines.push(`
INSERT INTO data_types (project_id, name, slug, description, is_active, settings, created_at, updated_at)
SELECT ${projectId}, ${quote(type.name)}, ${quote(type.slug)}, ${quote(type.description)}, 1, ${json({ singleton: type.singleton === true })}, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM data_types WHERE project_id = ${projectId} AND slug = ${quote(type.slug)} AND deleted_at IS NULL
);`);

  for (let index = 0; index < type.fields.length; index += 1) {
    const field = type.fields[index];
    lines.push(`
INSERT INTO data_type_fields
  (data_type_id, name, type, required, translatable, validation_rules, settings, sort_order, created_at, updated_at)
SELECT dt.id, ${quote(field.name)}, ${quote(field.type)}, ${field.required ? 1 : 0}, ${field.translatable ? 1 : 0}, ${json(field.validation_rules)}, ${json(field.settings)}, ${index}, NOW(), NOW()
FROM data_types dt
WHERE dt.project_id = ${projectId} AND dt.slug = ${quote(type.slug)} AND dt.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM data_type_fields f
    WHERE f.data_type_id = dt.id AND f.name = ${quote(field.name)} AND f.deleted_at IS NULL
  );`);

    // Repair schemas created by older admin builds. This changes schema data,
    // not HyperCore code, and preserves field ids and all existing entry values.
    lines.push(`
UPDATE data_type_fields f
JOIN data_types dt ON dt.id = f.data_type_id
SET f.type = ${quote(field.type)},
    f.validation_rules = ${json(field.validation_rules)},
    f.updated_at = NOW()
WHERE dt.project_id = ${projectId}
  AND dt.slug = ${quote(type.slug)}
  AND f.name = ${quote(field.name)}
  AND f.deleted_at IS NULL
  AND f.type = 'rich-text';`);
  }
}

for (const relation of CLINIC_RELATIONS) {
  lines.push(`
INSERT INTO data_type_fields
  (data_type_id, name, type, required, translatable, validation_rules, settings, sort_order, created_at, updated_at)
SELECT source_type.id, ${quote(relation.name)}, 'relation', 0, 0, JSON_ARRAY(),
  JSON_OBJECT(
    'relation_type', ${quote(relation.relationType)},
    'related_data_type_id', target_type.id,
    'multiple', ${relation.relationType === 'belongs_to' ? 'false' : 'true'}
  ), 100, NOW(), NOW()
FROM data_types source_type
JOIN data_types target_type
  ON target_type.project_id = source_type.project_id AND target_type.slug = ${quote(relation.target)}
WHERE source_type.project_id = ${projectId} AND source_type.slug = ${quote(relation.source)}
  AND NOT EXISTS (
    SELECT 1 FROM data_type_fields f
    WHERE f.data_type_id = source_type.id AND f.name = ${quote(relation.name)} AND f.deleted_at IS NULL
  );`);
}

for (const entry of CLINIC_STARTER_ENTRIES) {
  lines.push(`
INSERT INTO data_entries
  (slug, data_type_id, project_id, status, published_at, created_at, updated_at)
SELECT ${quote(entry.slug)}, dt.id, ${projectId}, 'published', NOW(), NOW(), NOW()
FROM data_types dt
WHERE dt.project_id = ${projectId} AND dt.slug = ${quote(entry.type)}
  AND NOT EXISTS (
    SELECT 1 FROM data_entries e WHERE e.project_id = ${projectId} AND e.slug = ${quote(entry.slug)} AND e.deleted_at IS NULL
  );`);

  const type = CLINIC_CONTENT_TYPES.find((candidate) => candidate.slug === entry.type);
  const fields = new Map(type.fields.map((field) => [field.name, field]));
  for (const [fieldName, translations] of Object.entries(entry.values)) {
    const field = fields.get(fieldName);
    if (!field) continue;
    const localizedValues = field.translatable
      ? Object.entries(translations).filter(([, value]) => value !== '')
      : [['en', translations.en ?? Object.values(translations)[0] ?? '']];

    for (const [language, value] of localizedValues) {
      lines.push(`
INSERT INTO data_entry_values
  (data_entry_id, data_type_field_id, language, value, created_at, updated_at)
SELECT e.id, f.id, ${quote(language)}, ${quote(value)}, NOW(), NOW()
FROM data_entries e
JOIN data_types dt ON dt.id = e.data_type_id
JOIN data_type_fields f ON f.data_type_id = dt.id AND f.name = ${quote(fieldName)} AND f.deleted_at IS NULL
WHERE e.project_id = ${projectId} AND e.slug = ${quote(entry.slug)} AND e.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM data_entry_values existing
    WHERE existing.data_entry_id = e.id
      AND existing.data_type_field_id = f.id
      AND existing.language = ${quote(language)}
      AND existing.deleted_at IS NULL
  );`);
    }
  }
}

lines.push(
  'COMMIT;',
  `SELECT COUNT(*) AS clinic_content_types FROM data_types WHERE project_id = ${projectId} AND slug IN (${CLINIC_CONTENT_TYPES.map((type) => quote(type.slug)).join(', ')});`,
  `SELECT COUNT(*) AS clinic_starter_entries FROM data_entries WHERE project_id = ${projectId} AND slug IN (${CLINIC_STARTER_ENTRIES.map((entry) => quote(entry.slug)).join(', ')});`,
);

process.stdout.write(lines.join('\n'));
