import { Download, ExternalLink, FileText } from 'lucide-react';
import { formatFileSize, type DocumentAttachment } from '@/lib/media/embeds';

interface DocumentDownloadListProps {
  documents: DocumentAttachment[];
  heading?: string;
}

export function DocumentDownloadList({
  documents,
  heading = 'Documentos y cartillas',
}: DocumentDownloadListProps) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold tracking-wider text-umber uppercase">{heading}</p>
      <ul className="space-y-2.5">
        {documents.map(doc => (
          <li
            key={doc.id}
            className="flex flex-col gap-3 rounded-xl border border-taupe bg-butter/80 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/25 text-umber">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{doc.title}</p>
                {doc.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-espresso">
                    {doc.description}
                  </p>
                )}
                {typeof doc.sizeBytes === 'number' && doc.sizeBytes > 0 && (
                  <span className="mt-1 inline-block rounded bg-surface px-2 py-0.5 text-[11px] font-medium text-earth">
                    PDF · {formatFileSize(doc.sizeBytes)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso transition-colors hover:bg-sand"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Ver PDF
              </a>
              <a
                href={doc.url}
                download={doc.fileName || true}
                className="inline-flex items-center gap-1.5 rounded-lg bg-umber px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-espresso"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Descargar
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
