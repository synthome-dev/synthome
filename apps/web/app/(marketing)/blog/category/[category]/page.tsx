import { CategoryBlogListWithPagination } from "@/app/(marketing)/blog/category-blog-list-with-pagination";
import { BlogFilter, Category } from "@/app/(marketing)/blog/category-filter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getAllCategories,
  getAllPosts,
  getCategoryPosts,
  getCategoryPostsCount,
  loadMoreCategoryPosts,
} from "@/lib/actions";
import { notFound } from "next/navigation";

const PAGE_SIZE = 9;

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const categories = await getAllCategories();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.title} - Blog`,
    description: `Browse ${category.title} articles and insights`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [posts, totalCount, allPosts] = await Promise.all([
    getCategoryPosts(category, PAGE_SIZE),
    getCategoryPostsCount(category),
    getAllPosts(),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  const categories: Category[] = Array.from(
    new Map(
      allPosts
        .filter((post) => post.category)
        .map((post) => [post.category.slug, post.category.title])
    )
  ).map(([slug, title]) => ({ slug, title }));

  const categoryTitle = posts[0]?.category?.title || category;

  // Create a bound server action
  const loadMoreAction = loadMoreCategoryPosts.bind(null, category);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="max-w-md">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {categoryTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-muted-foreground mt-4 text-balance text-4xl font-semibold">
            {categoryTitle} articles from{" "}
            <strong className="text-foreground font-semibold">Synthome</strong>
          </h1>
        </div>
      </div>
      <BlogFilter categories={categories} posts={allPosts} />
      <CategoryBlogListWithPagination
        initialPosts={posts}
        totalCount={totalCount}
        loadMoreAction={loadMoreAction}
      />
    </>
  );
}
