You will generate a complete technical article following the Synthome Global Article Instructions and the topic-specific parameters below.

## ARTICLE PARAMETERS

**Topic:** {{TOPIC}}
**Target Keyword:** {{KEYWORD}}
**Intent Level:** {{INTENT}}  # high / medium / low but high-intent
**Synthome Integration Level:** {{INTEGRATION}}  # light / medium / strong
**Article Type:** {{TYPE}}

# Example types: tutorial, concept, comparison, architecture guide, agent workflow, model integration guide

---

## BEFORE ANYTHING ELSE — STEP 1

### Generate a list of 6–12 **secondary keywords** related to the primary keyword

These must:

- be natural semantic variations
- capture adjacent developer search intent
- NOT be consumer-focused keywords
- appear organically in the article (NOT forced)

Format the list as:

**Secondary Keywords:**

- keyword 1
- keyword 2
- keyword 3
…

Do NOT generate the outline yet.
Wait for user confirmation after showing the secondary keywords.

---

## STEP 2 (after confirmation) — Generate the Article Outline

Produce a detailed outline with H2/H3 structure only.
Do NOT write the full article yet.

---

## STEP 3 (after second confirmation) — Write the Full Article

Produce a complete, production-ready Markdown article with:

1. A strong developer-oriented title
2. A 2–3 sentence abstract
3. H2/H3 structure following the outline
4. Full article content (1500–2000 words)
5. At least one complete TypeScript example
6. Synthome code examples if integration level = medium or strong
7. 2–3 diagram placeholders:
   - `[DIAGRAM: Describe diagram here]`

---

## CONTENT REQUIREMENTS

- Start with a problem-oriented introduction.
- Explain the underlying concepts clearly.
- Provide step-by-step instructions and practical examples.
- Show where manual or raw-API approaches become difficult.
- Show Synthome (light/medium/strong) according to integration level:
  - **Light:** Mention only near the end as an alternative.
  - **Medium:** Provide a short comparison + small code snippet.
  - **Strong:** Provide a full Synthome-based pipeline example.
- Use calm, senior-engineer, Vercel/Stripe-style tone.
- No fluff, no marketing language.
- Do NOT invent features Synthome does not have.

---

## FINAL CHECKLIST BEFORE OUTPUTTING ARTICLE

Ensure the article:

- Follows all global Synthome rules
- Uses clean, accurate TypeScript
- Contains at least one real-world AI media pipeline example
- Provides actionable developer insights
- Incorporates secondary keywords naturally (not forced)
