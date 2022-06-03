import Component from "../components/legal-copy.mdx";
export default function Legal() {
  return (
    <div className="w-full overflow-y-scroll flex-1">
      <div className="prose lg:prose-xl max-w-prose mx-auto my-12">
        <Component />
      </div>
    </div>
  );
}
