"use client";

import { useControllableState } from "@/hooks/use-controllable-state";
import { cn } from "@/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { easeOut, motion } from "framer-motion";
import * as React from "react";


interface InternalContextType {
  value: TabsPrimitive.TabsProps["value"];
}

const InternalContext = React.createContext<InternalContextType | null>(null);

const useInternalContext = () => {
  const context = React.useContext(InternalContext);

  if (!context) {
    throw new Error("Tabs must be used within a <Tabs />");
  }

  return context;
};

const Tabs = React.forwardRef<HTMLDivElement, TabsPrimitive.TabsProps>(
  (
    { children, defaultValue, value: valueProp, onValueChange, className },
    ref
  ) => {
    const [value, setValue] = useControllableState({
      value: valueProp,
      defaultValue: defaultValue,
      onChange: onValueChange,
    });

    return (
      <InternalContext.Provider value={{ value }}>
        <TabsPrimitive.Root
          ref={ref}
          className={cn("space-y-4", className)}
          defaultValue={defaultValue}
          value={value}
          onValueChange={(v) => setValue(v)}
        >
          {children}
        </TabsPrimitive.Root>
      </InternalContext.Provider>
    );
  }
);
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex shrink-0 gap-6 border-b", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ children, className, ...props }, ref) => {
  const { value } = useInternalContext();
  return (
    <>
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex-none relative isolate select-none items-center justify-center pb-3 pt-2 leading-none outline-none data-[state=active]:text-primary text-secondary text-sm font-medium",
          className
        )}
        {...props}
      >
        {children}
        {value === props.value ? (
          <motion.div
            layoutId="tab-trigger-underline"
            className="absolute inset-x-0 -bottom-px z-10 h-px bg-gray-900 dark:bg-gray-200"
            transition={{ ease: easeOut, duration: 0.2 }}
          />
        ) : null}
      </TabsPrimitive.Trigger>
      {/* {value === props.value ? (

      ) : null} */}
    </>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
