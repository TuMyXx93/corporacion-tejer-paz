import { z } from 'zod';
import validator from 'validator';

export const contactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre no puede superar 80 caracteres.'),
  lastName: z
    .string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .max(80, 'El apellido no puede superar 80 caracteres.'),
  email: z
    .string()
    .trim()
    .email('Ingresa un correo electrónico válido.')
    .max(254, 'El correo es demasiado largo.'),
  subject: z
    .string()
    .trim()
    .min(3, 'El asunto debe tener al menos 3 caracteres.')
    .max(160, 'El asunto no puede superar 160 caracteres.'),
  message: z
    .string()
    .trim()
    .min(10, 'El mensaje debe tener al menos 10 caracteres.')
    .max(4000, 'El mensaje no puede superar 4000 caracteres.'),
  // Honeypot anti-spam (debe quedar vacío en humanos)
  website: z.string().max(200).optional().default(''),
});

export type ContactPayload = z.infer<typeof contactSchema>;

export function escapeHtmlText(value: string): string {
  return validator.escape(validator.stripLow(value, true));
}

export function sanitizeHeaderText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 160);
}
