import { toastManager } from "@/components/ui/toast";

export const toast = {
  error: (title: string, description?: string) =>
    toastManager.add({ type: "error", title, description }),
  success: (title: string, description?: string) =>
    toastManager.add({ type: "success", title, description }),
  info: (title: string, description?: string) =>
    toastManager.add({ type: "info", title, description }),
  warning: (title: string, description?: string) =>
    toastManager.add({ type: "warning", title, description }),
  loading: (title: string, description?: string) =>
    toastManager.add({ type: "loading", title, description }),
};
