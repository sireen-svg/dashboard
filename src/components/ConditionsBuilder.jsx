import { useState } from 'react';
import { Form, Button, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import {
  CONDITION_OPERATORS,
  valueKind,
  newCondition,
  coerceValueForOperator,
} from '../lib/collectionConditions';

// A tiny tag input for the `in` operator: type a value, Enter/comma to add.
function TagInput({ values, onChange, disabled }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };
  return (
    <div
      className="form-control form-control-sm d-flex flex-wrap align-items-center gap-1"
      style={{ height: 'auto', minHeight: 31 }}
    >
      {values.map((v) => (
        <Badge key={v} bg="secondary" className="d-flex align-items-center gap-1">
          {v}
          {!disabled && (
            <i
              role="button"
              className="bi bi-x"
              onClick={() => onChange(values.filter((x) => x !== v))}
            />
          )}
        </Badge>
      ))}
      <input
        className="border-0 flex-grow-1"
        style={{ outline: 'none', minWidth: 60, background: 'transparent' }}
        value={draft}
        placeholder={values.length ? '' : 'Type & Enter'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        disabled={disabled}
      />
    </div>
  );
}

// Controlled conditions editor. Driven by (conditions, logic) props; every change calls
// onChange({ conditions, conditions_logic }). `fields` is the data type's fields (needs .name).
export default function ConditionsBuilder({ fields, conditions, logic, onChange, disabled }) {
  const setLogic = (l) => onChange({ conditions, conditions_logic: l });
  const setConditions = (next) => onChange({ conditions: next, conditions_logic: logic });

  const updateRow = (i, patch) =>
    setConditions(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const changeOperator = (i, op) =>
    updateRow(i, { operator: op, value: coerceValueForOperator(op, conditions[i].value) });
  const addRow = () => setConditions([...conditions, newCondition()]);
  const removeRow = (i) => setConditions(conditions.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ fontSize: 13, color: '#5f6368' }}>Match</span>
        <Form.Select
          size="sm"
          style={{ width: 130 }}
          value={logic}
          onChange={(e) => setLogic(e.target.value)}
          disabled={disabled}
        >
          <option value="and">ALL (and)</option>
          <option value="or">ANY (or)</option>
        </Form.Select>
        <span style={{ fontSize: 13, color: '#5f6368' }}>of the following</span>
      </div>

      {conditions.length === 0 && (
        <div className="text-muted mb-2" style={{ fontSize: 13 }}>
          No conditions yet — a dynamic collection with no conditions matches nothing. Add at least one.
        </div>
      )}

      {conditions.map((c, i) => {
        const kind = valueKind(c.operator);
        return (
          <Row key={i} className="g-2 mb-2 align-items-center">
            <Col md={3}>
              <Form.Select
                size="sm"
                value={c.field}
                onChange={(e) => updateRow(i, { field: e.target.value })}
                disabled={disabled}
              >
                <option value="">Field…</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                size="sm"
                value={c.operator}
                onChange={(e) => changeOperator(i, e.target.value)}
                disabled={disabled}
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={5}>
              {kind === 'single' && (
                <Form.Control
                  size="sm"
                  placeholder="Value"
                  value={c.value ?? ''}
                  onChange={(e) => updateRow(i, { value: e.target.value })}
                  disabled={disabled}
                />
              )}
              {kind === 'range' && (
                <InputGroup size="sm">
                  <Form.Control
                    placeholder="Min"
                    value={c.value?.[0] ?? ''}
                    onChange={(e) => updateRow(i, { value: [e.target.value, c.value?.[1] ?? ''] })}
                    disabled={disabled}
                  />
                  <InputGroup.Text>–</InputGroup.Text>
                  <Form.Control
                    placeholder="Max"
                    value={c.value?.[1] ?? ''}
                    onChange={(e) => updateRow(i, { value: [c.value?.[0] ?? '', e.target.value] })}
                    disabled={disabled}
                  />
                </InputGroup>
              )}
              {kind === 'multi' && (
                <TagInput
                  values={Array.isArray(c.value) ? c.value : []}
                  onChange={(vals) => updateRow(i, { value: vals })}
                  disabled={disabled}
                />
              )}
            </Col>
            <Col md={1} className="text-end">
              <Button
                variant="link"
                size="sm"
                className="p-0 text-danger"
                onClick={() => removeRow(i)}
                disabled={disabled}
                aria-label="Remove condition"
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </Col>
          </Row>
        );
      })}

      <Button variant="outline-secondary" size="sm" onClick={addRow} disabled={disabled}>
        <i className="bi bi-plus-lg me-1"></i>Add condition
      </Button>
    </div>
  );
}
