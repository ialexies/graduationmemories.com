interface ClassPhotoCardProps {
  classPhoto: string;
  batch: string;
  location: string;
}

export function ClassPhotoCard({ classPhoto, batch, location }: ClassPhotoCardProps) {
  return (
    <div className="glass-morphism rounded-3xl p-3 photo-shadow mb-8">
      <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-slate-200">
        <img
          src={classPhoto}
          alt="Main photo"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="py-4 px-2 flex justify-between items-center text-sm font-medium">
        <span style={{ color: 'var(--theme-accent)', opacity: 0.9 }} className="whitespace-pre-line">{batch}</span>
        <span style={{ color: 'var(--theme-accent)' }} className="whitespace-pre-line">{location}</span>
      </div>
    </div>
  );
}
