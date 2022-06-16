/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: [".*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  devServerPort: 8002,
  // serverDependenciesToBundle: ["monaco-editor"],
  mdx: async (filename) => {
    const [rehypeHighlight, remarkToc, rehypeSlug] = await Promise.all([
      import("rehype-highlight").then((mod) => mod.default),
      import("remark-toc").then((mod) => mod.default),
      import("rehype-slug").then((mod) => mod.default),
    ]);

    return {
      remarkPlugins: [remarkToc],
      rehypePlugins: [rehypeHighlight, rehypeSlug],
    };
  },
};
