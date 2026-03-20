import type { Student } from '../types';

interface ClassRegistryProps {
  students: Student[];
  togetherSince: string;
  peopleLabel?: string;
  peopleTagLabel?: string;
}

export function ClassRegistry({ students, togetherSince, peopleLabel = 'Class Registry', peopleTagLabel = 'Honor' }: ClassRegistryProps) {
  return (
    <section className="rounded-3xl p-8 text-white shadow-2xl" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--theme-accent)' }}>
          LIST
        </span>
        {peopleLabel}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 opacity-90">
        {students.map((student) => (
          <div
            key={student.name}
            className="flex justify-between border-b pb-1"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <span>{student.name}</span>
            {student.honor && (
              <span className="text-slate-500 text-xs">{peopleTagLabel}</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-slate-500">
        Together since {togetherSince}
      </p>
    </section>
  );
}
