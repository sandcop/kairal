const { z } = require('zod');

const subscribeSchema = z.object({
  email: z.string().email('Formato de email inválido').max(254),
  firstName: z.string().max(100).optional().default(''),
  lastName: z.string().max(100).optional().default(''),
  recurso: z.string().max(200).optional().default(''),
});

function validateBody(schema, rawBody) {
  let parsed;
  try {
    parsed = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : rawBody;
  } catch (_) {
    return { success: false, error: 'JSON inválido' };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const message = result.error.errors.map(e => e.message).join(', ');
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}

module.exports = { subscribeSchema, validateBody };
