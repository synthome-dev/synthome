'use server'

import { client } from '@/lib/sanity-client'
import { Post, PostWithBody } from '@/types/post'

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
]|order(publishedAt desc)[$offset...$end]{
  _id,
  title,
  description,
  "slug": slug.current,
  "href": slug.current,
  publishedAt,
  "date": publishedAt,
  "image": image.asset->url,
  category->{
    title,
    "slug": slug.current
  },
  authors[]->{
    name,
    "image": image.asset->url
  }
}`

const CATEGORY_POSTS_QUERY = `*[
  _type == "post" 
  && defined(slug.current) 
  && category->slug.current == $category
]|order(publishedAt desc)[$offset...$end]{
  _id,
  title,
  description,
  "slug": slug.current,
  "href": slug.current,
  publishedAt,
  "date": publishedAt,
  "image": image.asset->url,
  category->{
    title,
    "slug": slug.current
  },
  authors[]->{
    name,
    "image": image.asset->url
  }
}`

export async function loadMorePosts(offset: number, limit: number = 9): Promise<Post[]> {
    const end = offset + limit
    const posts = await client.fetch<Post[]>(POSTS_QUERY, { offset, end }, { next: { revalidate: 30 } })
    return posts
}

export async function loadMoreCategoryPosts(category: string, offset: number, limit: number = 9): Promise<Post[]> {
    const end = offset + limit
    const posts = await client.fetch<Post[]>(CATEGORY_POSTS_QUERY, { category, offset, end }, { next: { revalidate: 30 } })
    return posts
}

const POST_QUERY = `*[
  _type == "post" 
  && slug.current == $slug
][0]{
  _id,
  title,
  description,
  "slug": slug.current,
  publishedAt,
  "image": image.asset->url,
  category->{
    title,
    "slug": slug.current
  },
  authors[]->{
    name,
    "image": image.asset->url
  },
  body
}`

const ALL_POSTS_SLUGS_QUERY = `*[_type == "post" && defined(slug.current)]{
  "slug": slug.current
}`

export async function getPostBySlug(slug: string): Promise<PostWithBody | null> {
    const post = await client.fetch<PostWithBody>(POST_QUERY, { slug }, { next: { revalidate: 30 } })
    return post
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
    const posts = await client.fetch<{ slug: string }[]>(ALL_POSTS_SLUGS_QUERY, {}, { next: { revalidate: 30 } })
    return posts
}

export async function getInitialPosts(limit: number = 9): Promise<Post[]> {
    const INITIAL_POSTS_QUERY = `*[
      _type == "post" && defined(slug.current)
    ]|order(publishedAt desc)[0...${limit}]{
      _id,
      title,
      description,
      "slug": slug.current,
      "href": slug.current,
      publishedAt,
      "date": publishedAt,
      "image": image.asset->url,
      category->{
        title,
        "slug": slug.current
      },
      authors[]->{
        name,
        "image": image.asset->url
      }
    }`
    const posts = await client.fetch<Post[]>(INITIAL_POSTS_QUERY, {}, { next: { revalidate: 30 } })
    return posts
}

export async function getTotalPostsCount(): Promise<number> {
    const count = await client.fetch<number>(`count(*[_type == "post" && defined(slug.current)])`, {}, { next: { revalidate: 30 } })
    return count
}

export async function getCategoryPosts(category: string, limit: number = 9): Promise<Post[]> {
    const INITIAL_CATEGORY_POSTS_QUERY = `*[
      _type == "post" 
      && defined(slug.current) 
      && category->slug.current == $category
    ]|order(publishedAt desc)[0...${limit}]{
      _id,
      title,
      description,
      "slug": slug.current,
      "href": slug.current,
      publishedAt,
      "date": publishedAt,
      "image": image.asset->url,
      category->{
        title,
        "slug": slug.current
      },
      authors[]->{
        name,
        "image": image.asset->url
      }
    }`
    const posts = await client.fetch<Post[]>(INITIAL_CATEGORY_POSTS_QUERY, { category }, { next: { revalidate: 30 } })
    return posts
}

export async function getCategoryPostsCount(category: string): Promise<number> {
    const count = await client.fetch<number>(
        `count(*[_type == "post" && defined(slug.current) && category->slug.current == $category])`,
        { category },
        { next: { revalidate: 30 } }
    )
    return count
}

export async function getAllPosts(): Promise<Post[]> {
    const ALL_POSTS = `*[
      _type == "post" && defined(slug.current)
    ]|order(publishedAt desc){
      _id,
      title,
      description,
      "slug": slug.current,
      "href": slug.current,
      publishedAt,
      "date": publishedAt,
      "image": image.asset->url,
      category->{
        title,
        "slug": slug.current
      },
      authors[]->{
        name,
        "image": image.asset->url
      }
    }`
    const posts = await client.fetch<Post[]>(ALL_POSTS, {}, { next: { revalidate: 30 } })
    return posts
}

export async function getAllCategories(): Promise<{ title: string; slug: string }[]> {
    const categories = await client.fetch<{ title: string; slug: string }[]>(
        `*[_type == "category"]{ title, "slug": slug.current }`,
        {},
        { next: { revalidate: 30 } }
    )
    return categories
}