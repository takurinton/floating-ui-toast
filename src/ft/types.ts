import { ReactNode } from "react";

export type AppearanceTypes = "error" | "info" | "success" | "warning";
export type Id = string;
export type Callback = (id: Id) => void;
export type Options = {
  appearance?: AppearanceTypes;
  autoDismiss?: boolean;
  id?: string;
  onDismiss?: (id: string) => void;
  [key: string]: any;
};

export type AddToast = (
  content: ReactNode,
  options?: Options,
  callback?: (id: string) => void
) => void;
export type UpdateToast = (id: Id, options: Options) => void;
export type RemoveToast = (id: Id) => void;
export type HoverToast = () => void;

export type ToastType = Options & {
  appearance: AppearanceTypes;
  content: ReactNode;
  id: Id;
};
export type ToastsType = Array<ToastType>;

export type ToastProps = {
  appearance: AppearanceTypes;
  autoDismiss: boolean;
  autoDismissTimeout: number;
  children: ReactNode;
  isRunning: boolean;
  onDismiss: any;
  onMouseEnter: HoverToast;
  onMouseLeave: HoverToast;
  placement: string;
  transitionDuration: number;
  // transitionState: TransitionStatus;
};
