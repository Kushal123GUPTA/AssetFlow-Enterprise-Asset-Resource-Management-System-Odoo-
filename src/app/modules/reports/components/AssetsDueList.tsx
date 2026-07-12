"use client";

type DueAsset = {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  reason: string;
  location?: string | null;
};

type Props = {
  dueMaintenance: DueAsset[];
  nearingRetirement: DueAsset[];
};

export default function AssetsDueList({ dueMaintenance, nearingRetirement }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section>
        <h3 className="text-sm font-bold text-gray-200 mb-3 uppercase tracking-wide">
          Due for maintenance
        </h3>
        {dueMaintenance.length === 0 ? (
          <p className="text-sm text-gray-500">None flagged</p>
        ) : (
          <ul className="space-y-2">
            {dueMaintenance.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary">{a.assetTag}</span>
                  <span className="text-[10px] uppercase text-gray-500">{a.status}</span>
                </div>
                <p className="text-sm text-gray-200 mt-0.5">{a.name}</p>
                <p className="text-xs text-amber-500/90 mt-1">{a.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="text-sm font-bold text-gray-200 mb-3 uppercase tracking-wide">
          Nearing retirement
        </h3>
        {nearingRetirement.length === 0 ? (
          <p className="text-sm text-gray-500">None flagged</p>
        ) : (
          <ul className="space-y-2">
            {nearingRetirement.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary">{a.assetTag}</span>
                  <span className="text-[10px] uppercase text-gray-500">{a.status}</span>
                </div>
                <p className="text-sm text-gray-200 mt-0.5">{a.name}</p>
                <p className="text-xs text-gray-400 mt-1">{a.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
