import { z } from "zod";

const email = z.string().trim().toLowerCase().email("invalid_email").max(254);
const password = z.string().min(8, "password_too_short").max(128);
const displayName = z.string().trim().min(2, "name_too_short").max(60);

export const registerSchema = z.object({
  email,
  password,
  displayName,
  preferredLanguage: z.enum(["en", "bn", "ar"]).optional().default("en"),
});

export const loginSchema = z.object({
  email,
  password,
});

export const postCreateSchema = z.object({
  content: z.string().trim().min(1, "empty_post").max(5000),
  status: z.enum(["draft", "published"]).default("published"),
  pinned: z.boolean().optional().default(false),
});

export const reactionSchema = z.object({
  type: z.enum(["like", "love", "care", "laugh", "surprised", "sad"]),
});

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1, "empty_comment").max(2000),
  parentId: z.string().trim().optional().nullable(),
});

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error("validation_failed");
    err.issues = result.error.issues;
    err.status = 400;
    throw err;
  }
  return result.data;
}
