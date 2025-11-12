import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CeramicCard } from "@/components/ui/card";
// import type { Flow as FlowType } from "@repo/db";
import { VideoIcon } from "lucide-react";

type FlowType = {
  media?: string;
  name: string;
};

export const Flow = ({ flow }: { flow: FlowType }) => {
  return (
    <div className="group space-y-1.5 relative">
      <CeramicCard>
        <AspectRatio ratio={9 / 16}>
          <div className="rounded-lg border border-zinc-950/10 data-hover:border-zinc-950/20 dark:border-white/10 dark:data-hover:border-white/20 h-full !text-[12px] overflow-hidden text-secondary dark:text-zinc-500 prose">
            {flow.media ? (
              <img
                src={flow.media}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-white/10">
                <VideoIcon className="size-5 text-secondary" />
              </div>
            )}
            <div className="absolute font-medium bottom-0 rounded-b-lg left-[1px] right-[1px] p-2 bg-black/50 backdrop-blur-sm text-white">
              {flow.name}
            </div>
          </div>
        </AspectRatio>
      </CeramicCard>
    </div>
  );
};
