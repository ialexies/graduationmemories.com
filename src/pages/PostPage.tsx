import { useEffect } from "react";
import { HeroSection } from "../components/HeroSection";
import { ClassPhotoCard } from "../components/ClassPhotoCard";
import { ImageSlider } from "../components/ImageSlider";
import { TeacherMessage } from "../components/TeacherMessage";
import { TeacherAudioPlayer } from "../components/TeacherAudioPlayer";
import { ClassRegistry } from "../components/ClassRegistry";
import { Footer } from "../components/Footer";
import { getThemeColors, toCssVars } from "../lib/themePresets";
import type { Post, Footer as FooterType, PageLabels, SectionVisibility } from "../types";

interface PostPageProps {
  post: Post;
  footer: FooterType;
  labels?: PageLabels | null;
  sectionVisibility?: SectionVisibility | null;
  colorTheme?: string;
}

const DEFAULT_VISIBILITY = { classPhoto: true, gallery: true, teacherMessage: true, teacherAudio: true, peopleList: true, studentPhotos: false };

export function PostPage({ post, footer, labels, sectionVisibility, colorTheme = 'default' }: PostPageProps) {
  const vis = { ...DEFAULT_VISIBILITY, ...sectionVisibility };
  const themeLabel = labels?.themeLabel ?? 'Event Memories';
  const themeVars = toCssVars(getThemeColors(colorTheme));

  useEffect(() => {
    document.title = `${themeLabel} | ${post.sectionName} | AC 3D Prints & Crafts`;
  }, [post.sectionName, themeLabel]);

  let sectionIndex = 0;
  const nextDelay = () => {
    const delay = sectionIndex * 80;
    sectionIndex += 1;
    return delay;
  };

  return (
    <div className="bg-slate-50 text-slate-900 antialiased animate-fade-in" style={themeVars as React.CSSProperties}>
      <div className="animate-fade-in">
        <HeroSection
          sectionName={post.sectionName}
          quote={post.quote}
          themeLabel={labels?.themeLabel}
          titleLabel={labels?.titleLabel}
        />
      </div>

      <main className="max-w-2xl mx-auto px-6 -mt-16 pb-20 relative z-20">
        {vis.classPhoto !== false && (
          <div className="animate-slide-up" style={{ animationDelay: `${nextDelay()}ms` }}>
            <ClassPhotoCard
              classPhoto={post.classPhoto}
              batch={post.batch}
              location={post.location}
            />
          </div>
        )}

        {vis.gallery !== false && (
          <div className="animate-slide-up" style={{ animationDelay: `${nextDelay()}ms` }}>
            <ImageSlider images={post.gallery} title="GALLERY" layout="grid" />
          </div>
        )}

        {vis.teacherAudio !== false && post.teacherAudio && (
          <div className="animate-slide-up" style={{ animationDelay: `${nextDelay()}ms` }}>
            <TeacherAudioPlayer
              src={post.teacherAudio}
              label={labels?.messageAuthorLabel ? `Listen from ${labels.messageAuthorLabel}` : undefined}
            />
          </div>
        )}

        {vis.teacherMessage !== false && (
          <div className="animate-slide-up" style={{ animationDelay: `${nextDelay()}ms` }}>
            <TeacherMessage
              message={post.teacherMessage}
              teacherName={post.teacherName}
              teacherPhoto={post.teacherPhoto}
              teacherTitle={post.teacherTitle}
              messageLabel={labels?.messageLabel}
            />
          </div>
        )}

        {vis.peopleList !== false && (
          <div className="animate-slide-up" style={{ animationDelay: `${nextDelay()}ms` }}>
            <ClassRegistry
              students={post.students}
              togetherSince={post.togetherSince}
              peopleLabel={labels?.peopleLabel}
              peopleTagLabel={labels?.peopleTagLabel}
              showStudentPhotos={vis.studentPhotos}
            />
          </div>
        )}

        <div className="animate-fade-in" style={{ animationDelay: `${nextDelay()}ms` }}>
          <Footer footer={footer} />
        </div>
      </main>
    </div>
  );
}
