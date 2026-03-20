interface ClassPhotoCardProps {
  classPhoto: string;
  batch: string;
  location: string;
}

export function ClassPhotoCard({ classPhoto, batch, location }: ClassPhotoCardProps) {
  return (
    <div className="glass-morphism rounded-3xl p-3 photo-shadow mb-8">
      <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-200">
        <img
          src={classPhoto}
          alt="Main photo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="py-4 px-2 flex justify-between items-center text-sm font-medium text-slate-500">
        <span>{batch}</span>
        <span className="text-blue-600">{location}</span>
      </div>
    </div>
  );
}
