'use client';

type Props = {
  error?: string | null;
  actionMsg?: string | null;
};

export default function AlertBanner({ error, actionMsg }: Props) {
  return (
    <>
      {error     && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {actionMsg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{actionMsg}</div>}
    </>
  );
}