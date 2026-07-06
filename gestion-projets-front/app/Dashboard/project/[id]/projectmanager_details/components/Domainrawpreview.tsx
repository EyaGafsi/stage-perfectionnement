'use client';

type Props = {
  domainDetails?: Record<string, any> | null;
};

export default function DomainRawPreview({ domainDetails }: Props) {
  return (
    <section className="bg-white p-4 rounded-2xl border">
      <h3 className="text-sm font-medium mb-2 text-slate-600">Aperçu brut des détails domaine</h3>
      {domainDetails ? (
        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg max-h-48 overflow-auto text-xs">
          {JSON.stringify(domainDetails, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-400">Aucun détail spécifique enregistré.</p>
      )}
    </section>
  );
}