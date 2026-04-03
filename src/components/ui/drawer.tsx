"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type DrawerPosition = "right" | "left" | "top" | "bottom";
type DrawerVariant = "default" | "straight" | "inset";

interface DrawerPositionContextValue {
  position: DrawerPosition;
}

const DrawerPositionContext = createContext<DrawerPositionContextValue>({
  position: "bottom",
});

function getSwipeDirection(position: DrawerPosition) {
  switch (position) {
    case "left":
      return "left";
    case "right":
      return "right";
    case "top":
      return "up";
    case "bottom":
    default:
      return "down";
  }
}

function useDrawerPosition() {
  return useContext(DrawerPositionContext);
}

function Drawer({
  position = "bottom",
  ...props
}: DrawerPrimitive.Root.Props & { position?: DrawerPosition }) {
  return (
    <DrawerPositionContext.Provider value={{ position }}>
      <DrawerPrimitive.Root swipeDirection={getSwipeDirection(position)} {...props} />
    </DrawerPositionContext.Provider>
  );
}

function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

const DrawerPortal = DrawerPrimitive.Portal;

function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerBackdrop({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      data-slot="drawer-backdrop"
      {...props}
    />
  );
}

function DrawerViewport({ className, ...props }: DrawerPrimitive.Viewport.Props) {
  const { position } = useDrawerPosition();

  return (
    <DrawerPrimitive.Viewport
      className={cn(
        "fixed inset-0 z-50 grid",
        position === "bottom" && "grid-rows-[1fr_auto] pt-10",
        position === "top" && "grid-rows-[auto_1fr] pb-10",
        position === "left" && "flex justify-start",
        position === "right" && "flex justify-end",
        className,
      )}
      data-slot="drawer-viewport"
      {...props}
    />
  );
}

function DrawerBar({ className }: { className?: string }) {
  return (
    <div className="flex justify-center px-6 pt-3 pb-1.5">
      <div className={cn("h-1 w-12 rounded-full bg-muted-foreground/20", className)} />
    </div>
  );
}

function DrawerPopup({
  className,
  children,
  showCloseButton = false,
  showBar = false,
  variant = "default",
  ...props
}: DrawerPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  showBar?: boolean;
  variant?: DrawerVariant;
}) {
  const { position } = useDrawerPosition();

  return (
    <DrawerPortal>
      <DrawerBackdrop />
      <DrawerViewport>
        <DrawerPrimitive.Popup
          className={cn(
            "relative flex max-h-full min-h-0 w-full min-w-0 flex-col bg-popover bg-clip-padding text-popover-foreground shadow-lg transition-[opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
            position === "bottom" &&
              "row-start-2 border-t data-ending-style:translate-y-8 data-starting-style:translate-y-8 rounded-t-3xl",
            position === "top" &&
              "border-b data-ending-style:-translate-y-8 data-starting-style:-translate-y-8 rounded-b-3xl",
            position === "left" &&
              "w-[calc(100%-(--spacing(10)))] max-w-md border-e data-ending-style:-translate-x-8 data-starting-style:-translate-x-8 rounded-e-3xl",
            position === "right" &&
              "col-start-2 w-[calc(100%-(--spacing(10)))] max-w-md border-s data-ending-style:translate-x-8 data-starting-style:translate-x-8 rounded-s-3xl",
            variant === "straight" && "rounded-none",
            variant === "inset" &&
              "m-2 max-sm:rounded-[1.75rem] sm:m-4 sm:rounded-[2rem] before:hidden",
            className,
          )}
          data-slot="drawer-popup"
          {...props}
        >
          {showBar && position === "bottom" && <DrawerBar />}
          {children}
          {showCloseButton && (
            <DrawerPrimitive.Close
              aria-label="Close"
              className="absolute inset-e-2 top-2"
              render={<Button size="icon" variant="ghost" />}
            >
              <X />
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-6 pb-3 pt-2 in-[[data-slot=drawer-popup]:has([data-slot=drawer-panel])]:pb-3",
        className,
      )}
      data-slot="drawer-header"
      {...props}
    />
  );
}

function DrawerFooter({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "bare";
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end",
        variant === "default" && "border-t bg-muted/50 py-4",
        variant === "bare" && "pt-4 pb-6",
        className,
      )}
      data-slot="drawer-footer"
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      className={cn("font-heading text-lg leading-none", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

function DrawerPanel({
  className,
  scrollFade = true,
  ...props
}: React.ComponentProps<"div"> & { scrollFade?: boolean }) {
  return (
    <ScrollArea scrollFade={scrollFade}>
      <div className={cn("px-4 pb-6 sm:px-6", className)} data-slot="drawer-panel" {...props} />
    </ScrollArea>
  );
}

export {
  Drawer,
  DrawerBackdrop,
  DrawerBackdrop as DrawerOverlay,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerPopup as DrawerContent,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
};
