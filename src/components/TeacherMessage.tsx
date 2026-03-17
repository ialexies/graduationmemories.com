interface TeacherMessageProps {
  message: string;
  teacherName: string;
  teacherPhoto?: string;
  teacherTitle: string;
}

export function TeacherMessage({
  message,
  teacherName,
  teacherPhoto,
  teacherTitle,
}: TeacherMessageProps) {
  return (
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10 relative">
      <svg
        className="absolute top-6 left-6 w-12 h-12 text-blue-50 opacity-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V5C14.017 4.44772 14.4647 4 15.017 4H20.017C21.1216 4 22.017 4.89543 22.017 6V15C22.017 17.2091 20.2261 19 18.017 19H17.017L14.017 21ZM4.017 21L4.017 18C4.017 16.8954 4.91243 16 6.017 16H9.017C9.56928 16 10.017 15.5523 10.017 15V9C10.017 8.44772 9.56928 8 9.017 8H5.017C4.46472 8 4.017 7.55228 4.017 7V5C4.017 4.44772 4.46472 4 5.017 4H10.017C11.1216 4 12.017 4.89543 12.017 6V15C12.017 17.2091 10.2259 19 8.017 19H7.017L4.017 21Z" />
      </svg>
      <h3 className="serif text-xl font-bold text-slate-800 mb-4 text-center">
        Words from your Teacher
      </h3>
      <div className="flex flex-col items-center gap-4 mb-4">
        {teacherPhoto && (
          <img
            src={teacherPhoto}
            alt={teacherName}
            className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
          />
        )}
        <p className="text-slate-600 leading-relaxed italic text-center text-lg">
          "{message}"
        </p>
      </div>
      <div className="mt-6 text-center">
        <p className="font-bold text-slate-800">— {teacherName}</p>
        <p className="text-sm text-slate-400">{teacherTitle}</p>
      </div>
    </section>
  );
}
