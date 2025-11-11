"use client";

import { TrashIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronRight, Circle } from "lucide-react";
import * as React from "react";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "relative isolate flex items-center text-base rounded-sm px-3 py-2 outline-none transition-colors text-white",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "before:absolute before:inset-x-1 before:inset-y-px before:-z-1 before:shadow-[inset_0px_1px_0px_hsla(0,0%,100%,0.02),inset_0px_0px_0px_1px_hsla(0,0%,100%,0.02),0px_1px_2px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.08),0px_0px_0px_0.5px_rgba(0,0,0,0.24)] before:rounded before:bg-gray-800 before:opacity-0 hover:before:opacity-100 focus-visible:before:opacity-100",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] rounded-lg bg-gray-925 py-2 text-primary shadow-xl shadow-black/[0.08] ring-1 ring-gray-950",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "dark z-[99999] min-w-[240px] rounded-lg bg-gray-925 py-xs text-primary shadow-xl shadow-black/[0.08] ring-1 ring-gray-950 dark:ring-zinc-800",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const dropdownMenuItemVariants = cva([], {
  variants: {
    variant: {
      default: "before:bg-gray-800",
      destructive: "before:bg-red-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const DropdownMenuItemDelete = React.memo(
  ({ onConfirm }: { onConfirm: () => void }) => {
    const [state, setState] = React.useState<"Delete" | "Confirm?">("Delete");
    return (
      <DropdownMenuItem
        variant="destructive"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (state === "Confirm?") {
            onConfirm();
            return;
          }

          e.stopPropagation();
          setTimeout(() => {
            setState("Delete");
          }, 2000);

          setState("Confirm?");
        }}
      >
        <TrashIcon className="w-4" />
        {state}
      </DropdownMenuItem>
    );
  }
);
DropdownMenuItemDelete.displayName = "DropdownMenuItemDelete";

const DropdownMenuItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
      inset?: boolean;
    } & VariantProps<typeof dropdownMenuItemVariants>
  >(({ className, variant, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "cursor-pointer relative isolate py-1.5 px-3.5 font-medium outline-none [&>span]:cursor-default text-base flex items-center gap-2",
        "before:bg-gray-800 before:absolute before:inset-x-1 before:inset-y-px before:-z-1 before:shadow-[inset_0px_1px_0px_hsla(0,0%,100%,0.02),inset_0px_0px_0px_1px_hsla(0,0%,100%,0.02),0px_1px_2px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.08),0px_0px_0px_0.5px_rgba(0,0,0,0.24)] before:rounded before:opacity-0 hover:before:opacity-100 focus-visible:before:opacity-100",
        // "flex items-center rounded-sm py-1 text-sm h-7 cursor-pointer gap-1.5 outline-none ring-none",
        // "hover:bg-gray-100 aria-selected:bg-gray-100 data-[selected=true]:bg-gray-100",
        // "dark:hover:bg-zinc-700 dark:aria-selected:bg-zinc-700 dark:data-[selected=true]:bg-zinc-700",
        // // "relative isolate flex items-center text-base rounded-sm px-3 py-2 outline-none transition-colors text-white cursor-pointer gap-1.5",
        // // "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // // "before:absolute before:inset-x-1 before:inset-y-px before:-z-1 before:shadow-[inset_0px_1px_0px_hsla(0,0%,100%,0.02),inset_0px_0px_0px_1px_hsla(0,0%,100%,0.02),0px_1px_2px_rgba(0,0,0,0.12),0px_2px_4px_rgba(0,0,0,0.08),0px_0px_0px_0.5px_rgba(0,0,0,0.24)] before:rounded before:opacity-0 hover:before:opacity-100 focus-visible:before:opacity-100",
        // dropdownMenuItemVariants({ variant }),
        // inset && "pl-8",
        className
      )}
      {...props}
    />
  ))
);

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
  >(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  ))
);
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
  >(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  ))
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
      inset?: boolean;
    }
  >(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "py-1.5 pl-3 pr-2 text-sm font-semibold text-secondary",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  ))
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-900", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

interface MenuItemType {
  type: "item";
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  kbd?: string;
  label: React.ReactNode;
  destructive?: boolean;
  onSelect?: (event: Event) => void | Promise<void>;
  onMouseOver?: () => void;
  disabled?: boolean;
  url?: string;
  external?: boolean;
  download_as?: string;
  className?: string;
}

interface MenuSubType {
  type: "sub";
  leftSlot?: React.ReactNode;
  label: React.ReactNode;
  disabled?: boolean;
  items: MenuItem[];
}

interface MenuSeparatorType {
  type: "separator";
}

interface MenuHeadingType {
  type: "heading";
  label: React.ReactNode;
}

interface MenuTextType {
  type: "text";
  label: React.ReactNode;
}

type MenuItem =
  | MenuItemType
  | MenuSubType
  | MenuSeparatorType
  | MenuHeadingType
  | MenuTextType;

type MenuWidth = `w-[${number}px]` | `w-${number}`;

export type {
  MenuHeadingType,
  MenuItem,
  MenuItemType,
  MenuSeparatorType,
  MenuSubType,
  MenuTextType,
  MenuWidth
};

function isTruthy<T>(value: T | null | undefined | false | 0 | ""): value is T {
  return Boolean(value);
}

function buildMenuItems(
  items?: (MenuItem | undefined | false | null | "")[] | false
): MenuItem[] {
  if (!items) return [];
  return items?.filter(isTruthy) ?? [];
}

export { buildMenuItems };

  export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuItemDelete,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
  };

