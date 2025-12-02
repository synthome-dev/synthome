import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "kepkopk6",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function deleteAllPosts() {
  // Get all posts (including drafts)
  const posts = await client.fetch<{ _id: string; title: string }[]>(
    `*[_type == "post"]{ _id, title }`,
  );

  console.log(`Found ${posts.length} posts to delete\n`);

  for (const post of posts) {
    try {
      await client.delete(post._id);
      console.log(`✓ Deleted: ${post.title}`);
    } catch (error) {
      console.error(`✗ Failed to delete: ${post.title}`);
      console.error(`  Error: ${error}\n`);
    }
  }

  console.log("\nDeletion complete!");
}

deleteAllPosts().catch(console.error);
