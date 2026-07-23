import { CategoryView, categoryMetadata } from "@/components/site/CategoryView";
import { categoryBySlug } from "@/lib/categories";

// See the note in ../residential/page.tsx on route precedence.
const category = categoryBySlug("interiors")!;

export const revalidate = 3600;

export const generateMetadata = () => categoryMetadata(category);

export default function InteriorsPage() {
  return <CategoryView category={category} />;
}
