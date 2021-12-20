import {
  ChevronDownIcon,
  ChevronRightIcon,
  InboxInIcon,
  KeyIcon,
} from "@heroicons/react/outline";

const ResourceBar = () => {
  return (
    <div className="font-mono flex-1 itens-center rounded bg-canvas-50 hover:bg-canvas-100 text-canvas-500 cursor-pointer border p-2 cursor-no flex space-x-2">
      <div className="bg-sky-500 text-white p-1 rounded flex items-center justify-center text-xs font-bold">
        your-hooks
      </div>
      <ChevronRightIcon className="w-4 h-4 self-center" />

      <div className="font-mono">demo-hook</div>

      <div className="flex-1" />
      <div className="bg-fern-500 h-2 w-2 rounded-full self-center"></div>
      <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
        <InboxInIcon className="w-4 h-4 self-center" />
        <div className="self-center">1.2k</div>
      </div>
      <div className="flex border items-center space-x-1 flex-row text-canvas-400 px-2 p-1 rounded text-xs font-bold">
        <KeyIcon className="w-4 h-4 self-center" />
        <div className="self-center">2</div>
      </div>
      <ChevronDownIcon className="w-4 h-4 self-center" />
    </div>
  );
};

export default ResourceBar;
