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

  return (
    <div className="bg-slate-50 text-slate-900 antialiased" style={themeVars as React.CSSProperties}>
      <HeroSection
        sectionName={post.sectionName}
        quote={post.quote}
        themeLabel={labels?.themeLabel}
        titleLabel={labels?.titleLabel}
      />

      <main className="max-w-2xl mx-auto px-6 -mt-16 pb-20 relative z-20">
        {vis.classPhoto !== false && (
          <ClassPhotoCard
            classPhoto={post.classPhoto}
            batch={post.batch}
            location={post.location}
          />
        )}

        {vis.gallery !== false && <ImageSlider images={post.gallery} />}

        {vis.teacherAudio !== false && post.teacherAudio && (
          <TeacherAudioPlayer
            src={post.teacherAudio}
            label={labels?.messageAuthorLabel ? `Listen from ${labels.messageAuthorLabel}` : undefined}
          />
        )}

        {vis.teacherMessage !== false && (
          <TeacherMessage
            message={post.teacherMessage}
            teacherName={post.teacherName}
            teacherPhoto={post.teacherPhoto}
            teacherTitle={post.teacherTitle}
            messageLabel={labels?.messageLabel}
          />
        )}

        {vis.peopleList !== false && (
          <ClassRegistry
            students={post.students}
            togetherSince={post.togetherSince}
            peopleLabel={labels?.peopleLabel}
            peopleTagLabel={labels?.peopleTagLabel}
            showStudentPhotos={vis.studentPhotos}
          />
        )}

        <Footer footer={footer} />
      </main>
    </div>
  );
}
