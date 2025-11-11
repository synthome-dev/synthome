import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const noteVariants = cva(
  "relative flex max-w-6xl items-center ring-1 ring-inset gap-2 rounded-md p-2 text-sm",
  {
    variants: {
      variant: {
        blue: "bg-blue-700/4 text-blue-700 ring-blue-700/12 dark:bg-ceramic-blue/12",
        green:
          "bg-green-700/4 text-green-700 ring-green-700/12 dark:bg-green-700/4",
      },
    },
    defaultVariants: {
      variant: "blue",
    },
  }
);

export interface NoteProps extends VariantProps<typeof noteVariants> {
  children: React.ReactNode;
  className?: string;
}

export const Note = ({ children, className, variant }: NoteProps) => {
  return (
    <div className={cn(noteVariants({ variant }), className)}>{children}</div>
  );
};
