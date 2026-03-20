import { useState } from 'react';
import type { Student } from '../types';

const DEFAULT_AVATAR = '/default-avatar.svg';

interface ClassRegistryProps {
  students: Student[];
  togetherSince: string;
  peopleLabel?: string;
  peopleTagLabel?: string;
  showStudentPhotos?: boolean;
}

function StudentAvatar({ src }: { src: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <img
      src={errored ? DEFAULT_AVATAR : src}
      alt=""
      className="w-10 h-10 rounded-full object-cover shrink-0 bg-white/20"
      onError={() => setErrored(true)}
    />
  );
}

export function ClassRegistry({ students, togetherSince, peopleLabel = 'Class Registry', peopleTagLabel = 'Honor', showStudentPhotos }: ClassRegistryProps) {
  return (
    <section className="rounded-3xl p-8 text-white shadow-2xl" style={{ backgroundColor: 'var(--theme-card-bg)' }}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--theme-accent)' }}>
          LIST
        </span>
        {peopleLabel}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 opacity-90">
        {students.map((student, i) => (
          <div
            key={`${student.name}-${i}`}
            className="flex items-center gap-3 justify-between border-b pb-1"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {showStudentPhotos && (
                <StudentAvatar src={student.photo || DEFAULT_AVATAR} />
              )}
              <span>{student.name}</span>
            </div>
            {student.honor && (
              <span className="text-slate-500 text-xs shrink-0">{peopleTagLabel}</span>
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
