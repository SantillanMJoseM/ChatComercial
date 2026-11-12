export type Condition = { field: string; op: string; value?: any; and?: Condition[]; or?: Condition[] };

function get(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function cmp(a: any, op: string, b: any): boolean {
  switch (op) {
    case 'eq': return a === b;
    case 'ne': return a !== b;
    case 'gt': return a > b;
    case 'gte': return a >= b;
    case 'lt': return a < b;
    case 'lte': return a <= b;
    case 'contains': return typeof a === 'string' && a.toLowerCase().includes(String(b).toLowerCase());
    case 'notContains': return typeof a === 'string' && !a.toLowerCase().includes(String(b).toLowerCase());
    case 'in': return Array.isArray(b) && b.includes(a);
    case 'notIn': return Array.isArray(b) && !b.includes(a);
    case 'isEmpty': return a == null || a === '' || (Array.isArray(a) && a.length === 0);
    case 'isNotEmpty': return !(a == null || a === '' || (Array.isArray(a) && a.length === 0));
    default: return false;
  }
}

export function evaluateCondition(cond: Condition, ctx: any): boolean {
  if (cond.and && Array.isArray(cond.and)) return cond.and.every((c) => evaluateCondition(c, ctx));
  if (cond.or && Array.isArray(cond.or)) return cond.or.some((c) => evaluateCondition(c, ctx));
  const val = get(ctx, cond.field);
  return cmp(val, cond.op, cond.value);
}

export function evaluateConditions(conditions: any, ctx: any): { result: boolean; details: any[] } {
  if (!conditions) return { result: true, details: [] };
  // support { combine: 'and'|'or', filters: [...] } or array
  if (conditions.combine && Array.isArray(conditions.filters)) {
    const res = conditions.combine === 'or'
      ? conditions.filters.some((c: any) => evaluateCondition(c, ctx))
      : conditions.filters.every((c: any) => evaluateCondition(c, ctx));
    return { result: res, details: conditions.filters.map((c: any) => ({ field: c.field, op: c.op, value: c.value, actual: get(ctx, c.field), result: evaluateCondition(c, ctx) })) };
  }
  if (Array.isArray(conditions)) {
    return { result: conditions.every((c) => evaluateCondition(c, ctx)), details: conditions.map((c: any) => ({ ...c, actual: get(ctx, c.field), result: evaluateCondition(c, ctx) })) };
  }
  // single condition
  return { result: evaluateCondition(conditions, ctx), details: [{ ...conditions, actual: get(ctx, conditions.field), result: evaluateCondition(conditions, ctx) }] };
}
