'use client';

type Props = {
  label: string;
  value?: string | null;
};

export default function ReadOnlyField({ label, value }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-600">{label}</label>
      <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 min-h-[2.375rem]">
        {value || <span className="text-slate-400">—</span>}
      </div>
    </div>
  );
}