// Pure helpers for building/serializing dynamic-collection conditions.
// Kept separate from the ConditionsBuilder component so that component file only
// exports a component (react-refresh friendliness).

// Operators supported by the backend DynamicCollectionQueryBuilder (operatorStrategies).
// `incollection` is intentionally omitted — it's a special "entry is in another collection"
// filter whose value isn't a plain field value, so it doesn't fit this field/op/value UI.
export const CONDITION_OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<=', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'in', label: 'in (any of)' },
  { value: 'between', label: 'between' },
];

// How many value inputs an operator needs:
//   single → scalar value; multi → array (`in`); range → [min, max] (`between`)
export function valueKind(op) {
  if (op === 'in') return 'multi';
  if (op === 'between') return 'range';
  return 'single';
}

export function newCondition() {
  return { field: '', operator: '=', value: '' };
}

// Reshape a condition's value when the operator changes between single/multi/range.
export function coerceValueForOperator(op, value) {
  const kind = valueKind(op);
  if (kind === 'multi') {
    if (Array.isArray(value)) return value;
    return value === '' || value == null ? [] : [String(value)];
  }
  if (kind === 'range') {
    if (Array.isArray(value)) return [value[0] ?? '', value[1] ?? ''];
    return ['', ''];
  }
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

// Strip incomplete rows and normalize each value to the shape the backend expects:
//   comparisons → trimmed string, `in` → string[], `between` → [min, max].
export function cleanConditions(conditions) {
  return conditions
    .map((c) => {
      const kind = valueKind(c.operator);
      let value;
      if (kind === 'multi') {
        value = (Array.isArray(c.value) ? c.value : []).map((v) => String(v).trim()).filter(Boolean);
      } else if (kind === 'range') {
        value = [String(c.value?.[0] ?? '').trim(), String(c.value?.[1] ?? '').trim()];
      } else {
        value = String(c.value ?? '').trim();
      }
      return { field: c.field, operator: c.operator, value };
    })
    .filter((c) => {
      if (!c.field) return false;
      const kind = valueKind(c.operator);
      if (kind === 'multi') return c.value.length > 0;
      if (kind === 'range') return c.value[0] !== '' && c.value[1] !== '';
      return c.value !== '';
    });
}
