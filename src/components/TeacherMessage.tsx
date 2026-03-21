import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';

interface TeacherMessageProps {
  message: string;
  teacherName: string;
  teacherPhoto?: string;
  teacherTitle: string;
  messageLabel?: string;
}

const COLLAPSE_CHAR_LIMIT = 350;

function looksLikeHtml(str: string): boolean {
  return /<(p|div|br|h[1-6]|strong|b|em|i|ul|ol|li|blockquote|pre|code|a)\b/.test(str);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function TeacherMessage({
  message,
  teacherName,
  teacherPhoto,
  teacherTitle,
  messageLabel = 'Message from Host',
}: TeacherMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const isHtml = looksLikeHtml(message);
  const plainLength = isHtml ? stripHtml(message).length : message.length;
  const isLong = plainLength > COLLAPSE_CHAR_LIMIT;

  const displayContent = useMemo(() => {
    if (isHtml) {
      const sanitized = DOMPurify.sanitize(message, {
        ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'],
        ALLOWED_ATTR: ['style', 'href', 'target', 'rel'],
      });
      if (isLong && !expanded) {
        const plain = stripHtml(sanitized);
        const truncated = plain.slice(0, COLLAPSE_CHAR_LIMIT).trim() + '...';
        return { type: 'plain' as const, value: truncated };
      }
      return { type: 'html' as const, value: sanitized };
    }
    if (isLong && !expanded) {
      return { type: 'plain' as const, value: message.slice(0, COLLAPSE_CHAR_LIMIT).trim() + '...' };
    }
    return { type: 'plain' as const, value: message };
  }, [message, isHtml, isLong, expanded]);

  return (
    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-10 relative">
      <svg
        className="absolute top-6 left-6 w-12 h-12 opacity-10"
        fill="var(--theme-accent)"
        viewBox="0 0 24 24"
      >
        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 7.55228 14.017 7V5C14.017 4.44772 14.4647 4 15.017 4H20.017C21.1216 4 22.017 4.89543 22.017 6V15C22.017 17.2091 20.2261 19 18.017 19H17.017L14.017 21ZM4.017 21L4.017 18C4.017 16.8954 4.91243 16 6.017 16H9.017C9.56928 16 10.017 15.5523 10.017 15V9C10.017 8.44772 9.56928 8 9.017 8H5.017C4.46472 8 4.017 7.55228 4.017 7V5C4.017 4.44772 4.46472 4 5.017 4H10.017C11.1216 4 12.017 4.89543 12.017 6V15C12.017 17.2091 10.2259 19 8.017 19H7.017L4.017 21Z" />
      </svg>
      <h3 className="serif text-xl font-bold text-slate-800 mb-4 text-center">
        {messageLabel}
      </h3>
      <div className="flex flex-col items-center gap-4 mb-4">
        {teacherPhoto && (
          <img
            src={teacherPhoto}
            alt={teacherName}
            className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
            loading="lazy"
          />
        )}
        <div className="w-full">
          <div
            className="text-slate-600 leading-relaxed text-left text-lg pl-4 border-l-4 teacher-message-content [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:my-2 [&_pre]:p-4 [&_pre]:bg-slate-100 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-sm [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm [&_a]:underline [&_a]:text-[var(--theme-accent)] [&_a]:hover:opacity-80"
            style={{ borderColor: 'var(--theme-accent)' }}
          >
            {displayContent.type === 'html' ? (
              <div className="italic">
                <span>"</span>
                <div dangerouslySetInnerHTML={{ __html: displayContent.value }} />
                <span>"</span>
              </div>
            ) : (
              <p className="italic whitespace-pre-line">"{displayContent.value}"</p>
            )}
          </div>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-3 text-sm font-medium transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
              style={{ color: 'var(--theme-accent)' }}
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="font-bold text-slate-800">— {teacherName}</p>
        <p className="text-sm text-slate-400">{teacherTitle}</p>
      </div>
    </section>
  );
}
