import type { Student } from '../types';

interface ClassRegistryProps {
  students: Student[];
  togetherSince: string;
}

export function ClassRegistry({ students, togetherSince }: ClassRegistryProps) {
  return (
    <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
        <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs">
          LIST
        </span>
        Class Registry
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 opacity-90">
        {students.map((student) => (
          <div
            key={student.name}
            className="flex justify-between border-b border-slate-800 pb-1"
          >
            <span>{student.name}</span>
            {student.honor && (
              <span className="text-slate-500 text-xs">Honor</span>
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
