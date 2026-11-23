import { createCn } from "cn/config";

/**
 * Class-name merge (clsx + tailwind-merge) that knows our custom type scale.
 * Without this, `text-caption`, `text-body`, … are mistaken for text *colours* and silently drop
 * classes like `text-brand-foreground`. Always import `cn` from here, never from "cn".
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "body", "small", "caption"] }],
    },
  },
});
