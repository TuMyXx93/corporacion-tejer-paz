'use client';

import { useState, type FormEvent } from 'react';
import { contactSchema } from '@/lib/contact/schema';

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function ContactForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot

  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle'
  );
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFeedback('');

    const parsed = contactSchema.safeParse({
      firstName,
      lastName,
      email,
      subject,
      message,
      website,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors | undefined;
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      setStatus('error');
      setFeedback('Por favor corrige los campos señalados.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatus('error');
        setFeedback(
          json.error ||
            'No pudimos enviar tu mensaje en este momento. Intenta de nuevo o escríbenos por correo.'
        );
        return;
      }

      setStatus('success');
      setFeedback(json.message || 'Gracias por escribirnos. Hemos recibido tu mensaje.');
      setFirstName('');
      setLastName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setWebsite('');
    } catch {
      setStatus('error');
      setFeedback(
        'Error de conexión. Verifica tu red o escríbenos directamente al correo oficial.'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot invisible para usuarios humanos */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Sitio web</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={e => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-firstName"
            className="mb-1.5 block text-sm font-medium text-espresso"
          >
            Nombre <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            className="w-full rounded-lg border border-espresso/40 bg-white/70 px-3.5 py-2.5 text-base text-espresso placeholder:text-earth focus:border-umber"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs font-medium text-red-700">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-lastName"
            className="mb-1.5 block text-sm font-medium text-espresso"
          >
            Apellido <span aria-hidden="true">*</span>
          </label>
          <input
            id="contact-lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            className="w-full rounded-lg border border-espresso/40 bg-white/70 px-3.5 py-2.5 text-base text-espresso placeholder:text-earth focus:border-umber"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs font-medium text-red-700">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-1.5 block text-sm font-medium text-espresso"
        >
          Correo electrónico <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          className="w-full rounded-lg border border-espresso/40 bg-white/70 px-3.5 py-2.5 text-base text-espresso placeholder:text-earth focus:border-umber"
        />
        {errors.email && (
          <p className="mt-1 text-xs font-medium text-red-700">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-subject"
          className="mb-1.5 block text-sm font-medium text-espresso"
        >
          Asunto <span aria-hidden="true">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
          aria-invalid={Boolean(errors.subject)}
          className="w-full rounded-lg border border-espresso/40 bg-white/70 px-3.5 py-2.5 text-base text-espresso placeholder:text-earth focus:border-umber"
        />
        {errors.subject && (
          <p className="mt-1 text-xs font-medium text-red-700">{errors.subject}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block text-sm font-medium text-espresso"
        >
          Mensaje <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          value={message}
          onChange={e => setMessage(e.target.value)}
          aria-invalid={Boolean(errors.message)}
          className="w-full rounded-lg border border-espresso/40 bg-white/70 px-3.5 py-2.5 text-base text-espresso placeholder:text-earth focus:border-umber"
        />
        {errors.message && (
          <p className="mt-1 text-xs font-medium text-red-700">{errors.message}</p>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            status === 'success'
              ? 'border-emerald-700/30 bg-emerald-50 text-emerald-900'
              : 'border-red-700/30 bg-red-50 text-red-900'
          }`}
        >
          {feedback}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-lg bg-umber px-6 py-3 text-base font-semibold text-cream transition-colors hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Enviando mensaje...' : 'Enviar'}
      </button>
    </form>
  );
}
