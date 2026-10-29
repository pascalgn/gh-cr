import { defaultSchema } from "hast-util-sanitize";
import type { Options } from "rehype-sanitize";

/**
 * What raw HTML a comment body may keep.
 *
 * GitHub allows `<img>` in comments, so escaping all raw HTML loses real
 * content. The default schema is GitHub's own sanitation model — `<script>`,
 * event handlers and non-http(s) urls never survive it — widened only by the
 * image attributes people actually use.
 */
export const commentSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "alt",
      "title",
      "width",
      "height",
    ],
  },
};
