import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner } from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';

import { createDataType, createEntry, createField, getDataTypes, getFields } from '../api/cms';
import {
  CLINIC_CONTENT_TYPES,
  CLINIC_RELATIONS,
  CLINIC_STARTER_ENTRIES,
} from '../data/clinicTemplates';
import { getApiError } from '../lib/utils';

function responseData(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function asList(response) {
  const value = responseData(response);
  return Array.isArray(value) ? value : [];
}

function entryValuesForType(entry, contentType, primaryLanguage) {
  const fields = new Map(contentType.fields.map((field) => [field.name, field]));

  return Object.fromEntries(
    Object.entries(entry.values).map(([name, localizedValue]) => {
      const schemaField = fields.get(name);
      if (!schemaField?.translatable) {
        return [name, { [primaryLanguage]: localizedValue[primaryLanguage] ?? localizedValue.en ?? '' }];
      }
      return [name, localizedValue];
    }),
  );
}

export default function ClinicSetupPage() {
  const { project, dataTypes, refreshDataTypes } = useOutletContext();
  const [running, setRunning] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [messages, setMessages] = useState([]);
  const [errors, setErrors] = useState([]);

  const existingSlugs = useMemo(
    () => new Set(dataTypes.map((type) => type.slug)),
    [dataTypes],
  );
  const missingTypes = CLINIC_CONTENT_TYPES.filter((type) => !existingSlugs.has(type.slug));
  const primaryLanguage = project?.supported_languages?.[0] || 'en';

  function log(message) {
    setMessages((current) => [...current, message]);
  }

  function recordError(scope, error) {
    setErrors((current) => [...current, `${scope}: ${getApiError(error)}`]);
  }

  async function provisionSchema() {
    if (running) return;
    setRunning(true);
    setMessages([]);
    setErrors([]);

    try {
      const typesResponse = await getDataTypes();
      const contentTypes = new Map(asList(typesResponse).map((type) => [type.slug, type]));

      for (const template of CLINIC_CONTENT_TYPES) {
        let dataType = contentTypes.get(template.slug);
        if (!dataType) {
          try {
            const created = await createDataType({
              name: template.name,
              slug: template.slug,
              description: template.description,
            });
            dataType = responseData(created);
            contentTypes.set(template.slug, dataType);
            log(`Created ${template.name}`);
          } catch (error) {
            recordError(template.slug, error);
            continue;
          }
        } else {
          log(`Kept existing ${template.name}`);
        }

        let existingFields = [];
        try {
          existingFields = asList(await getFields(dataType.slug));
        } catch (error) {
          recordError(`${template.slug} fields`, error);
          continue;
        }
        const fieldNames = new Set(existingFields.map((field) => field.name));

        for (let index = 0; index < template.fields.length; index += 1) {
          const templateField = template.fields[index];
          if (fieldNames.has(templateField.name)) continue;
          try {
            await createField(dataType.id, { ...templateField, sort_order: index });
            fieldNames.add(templateField.name);
            log(`Added ${template.slug}.${templateField.name}`);
          } catch (error) {
            recordError(`${template.slug}.${templateField.name}`, error);
          }
        }
      }

      for (const relation of CLINIC_RELATIONS) {
        const source = contentTypes.get(relation.source);
        const target = contentTypes.get(relation.target);
        if (!source || !target) continue;

        try {
          const fields = asList(await getFields(source.slug));
          if (fields.some((field) => field.name === relation.name)) continue;
          await createField(source.id, {
            name: relation.name,
            type: 'relation',
            required: false,
            translatable: false,
            validation_rules: [],
            settings: {
              relation_type: relation.relationType,
              related_data_type_id: Number(target.id),
              multiple: relation.relationType !== 'belongs_to',
            },
            sort_order: 100,
          });
          log(`Linked ${relation.source} to ${relation.target}`);
        } catch (error) {
          recordError(`${relation.source}.${relation.name}`, error);
        }
      }

      await refreshDataTypes();
    } finally {
      setRunning(false);
    }
  }

  async function addStarterContent() {
    if (seeding || missingTypes.length > 0) return;
    setSeeding(true);
    setMessages([]);
    setErrors([]);

    try {
      for (const entry of CLINIC_STARTER_ENTRIES) {
        const contentType = CLINIC_CONTENT_TYPES.find((type) => type.slug === entry.type);
        if (!contentType) continue;
        try {
          await createEntry(entry.type, {
            slug: entry.slug,
            status: 'published',
            values: entryValuesForType(entry, contentType, primaryLanguage),
            seo: entry.seo,
          });
          log(`Published ${entry.type}/${entry.slug}`);
        } catch (error) {
          if (error.response?.status === 422 && /slug.*taken|already|unique/i.test(getApiError(error))) {
            log(`Kept existing ${entry.type}/${entry.slug}`);
          } else {
            recordError(`${entry.type}/${entry.slug}`, error);
          }
        }
      }
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h2>Clinic website setup</h2>
        <p className="page-subtitle">
          Provision the website content model through the existing CMS API. No backend migration is required.
        </p>
      </div>

      <Card className="mb-3">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h5 className="mb-2">Clinic content model</h5>
              <p className="text-muted mb-3">
                {CLINIC_CONTENT_TYPES.length} content types for global settings, home, doctors, services,
                health posts, navigation and supporting pages.
              </p>
              <div className="d-flex flex-wrap gap-2">
                {CLINIC_CONTENT_TYPES.map((type) => (
                  <Badge key={type.slug} bg={existingSlugs.has(type.slug) ? 'success' : 'secondary'}>
                    {type.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={provisionSchema} disabled={running || seeding}>
              {running ? <><Spinner size="sm" className="me-2" />Provisioning</> : 'Provision or repair schema'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Body className="p-4 d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h5 className="mb-2">Starter clinic content</h5>
            <p className="text-muted mb-0">
              Adds bilingual home copy, a doctor profile, features, services, health articles, FAQ and navigation.
              Existing entries with the same slug are preserved.
            </p>
          </div>
          <Button
            variant="outline-primary"
            onClick={addStarterContent}
            disabled={running || seeding || missingTypes.length > 0}
          >
            {seeding ? <><Spinner size="sm" className="me-2" />Adding content</> : 'Add starter content'}
          </Button>
        </Card.Body>
      </Card>

      {missingTypes.length > 0 && <Alert variant="warning">Provision the schema before adding starter content.</Alert>}

      {messages.length > 0 && (
        <Alert variant="success">
          <strong>Completed actions</strong>
          <ul className="mb-0 mt-2">{messages.map((message) => <li key={message}>{message}</li>)}</ul>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="danger">
          <strong>{errors.length} item(s) need attention</strong>
          <ul className="mb-0 mt-2">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </Alert>
      )}
    </div>
  );
}
