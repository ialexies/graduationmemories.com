import { useEffect } from "react";
import { HeroSection } from "../components/HeroSection";
import { ClassPhotoCard } from "../components/ClassPhotoCard";
import { ImageSlider } from "../components/ImageSlider";
import { TeacherMessage } from "../components/TeacherMessage";
import { ClassRegistry } from "../components/ClassRegistry";
import { Footer } from "../components/Footer";
import type { Post, Footer as FooterType } from "../types";

interface PostPageProps {
  post: Post;
  footer: FooterType;
}

export function PostPage({ post, footer }: PostPageProps) {
  useEffect(() => {
    document.title = `Class Memories | ${post.sectionName} | AC 3D Prints & Crafts`;
  }, [post.sectionName]);

  return (
    <div className="bg-slate-50 text-slate-900 antialiased">
      <HeroSection sectionName={post.sectionName} quote={post.quote} />

      <main className="max-w-2xl mx-auto px-6 -mt-16 pb-20 relative z-20">
        <ClassPhotoCard
          classPhoto={post.classPhoto}
          batch={post.batch}
          location={post.location}
        />

        <ImageSlider images={post.gallery} />

        <TeacherMessage
          message={post.teacherMessage}
          teacherName={post.teacherName}
          teacherPhoto={post.teacherPhoto}
          teacherTitle={post.teacherTitle}
        />

        <ClassRegistry
          students={post.students}
          togetherSince={post.togetherSince}
        />

        <Footer footer={footer} />
      </main>
    </div>
  );
}
