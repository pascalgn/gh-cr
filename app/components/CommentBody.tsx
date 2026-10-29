import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { commentSchema } from "./commentSchema";

import "./CommentBody.css";

/**
 * A comment body as GitHub-flavoured markdown.
 *
 * Raw HTML is parsed, because GitHub allows tags like `<img>` in comments and
 * escaping them would lose real content — but everything then passes through
 * `rehype-sanitize`, since these bodies are written by arbitrary GitHub users.
 * Links are forced to open away from the app.
 */
export function CommentBody({ body }: { body: string }) {
  return (
    <div className="commentBody">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, commentSchema]]}
        components={{
          // `node` is react-markdown's own hast node; spreading it onto the
          // element would render it as a stray DOM attribute.
          a: ({ node: _node, children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
