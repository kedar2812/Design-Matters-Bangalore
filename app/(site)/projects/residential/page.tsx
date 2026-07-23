import { CategoryView, categoryMetadata } from "@/components/site/CategoryView";
import { categoryBySlug } from "@/lib/categories";

// A static segment, so it always wins over /projects/[slug]. The
// matching slug is reserved in `actions/studio-projects` to keep a
// project from ever being shadowed by this route.
const category = categoryBySlug("residential")!;

export const revalidate = 3600;

export const generateMetadata = () => categoryMetadata(category);

export default function ResidentialPage() {
  return <CategoryView category={category} />;
}
