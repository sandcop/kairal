const { z } = require('zod');

const subscribeSchema = z.object({
  email: z.string().email('Formato de email inválido').max(254),
  firstName: z.string().max(100).optional().default(''),
  lastName: z.string().max(100).optional().default(''),
  recurso: z.string().max(200).optional().default(''),
});

// Autoevaluación funcional: el cliente manda su correo y el puntaje de cada
// sistema. Nunca manda texto del informe — ese lo construye el servidor a
// partir de autoeval-contenido.js, para que no se pueda inyectar contenido.
const autoevalSchema = z.object({
  email: z.string().email('Formato de email inválido').max(254),
  firstName: z.string().max(100).optional().default(''),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Falta aceptar el envío del informe' }),
  }),
  scores: z.object({
    dig:    z.number().int().min(0).max(21),
    neuro:  z.number().int().min(0).max(21),
    inmune: z.number().int().min(0).max(18),
    metab:  z.number().int().min(0).max(18),
  }),
  answered: z.number().int().min(0).max(26).optional().default(0),
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

module.exports = { subscribeSchema, autoevalSchema, validateBody };
