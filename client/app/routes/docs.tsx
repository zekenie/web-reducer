import Component from "../content/docs.mdx";
export default function Docs() {
  return (
    <div className="w-full overflow-y-scroll flex-1">
      <div className="prose lg:prose-xl max-w-prose mx-auto my-12 docs">
        <Component />
      </div>
    </div>
  );
}
