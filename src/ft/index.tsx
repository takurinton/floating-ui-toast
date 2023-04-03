import {
  autoUpdate,
  ExtendedRefs,
  FloatingPortal,
  inner,
  Placement,
  useFloating,
  UseFloatingReturn,
  useMergeRefs,
  useTransitionStyles,
} from "@floating-ui/react";
import * as React from "react";
import { AddToast, AppearanceTypes, ToastsType, ToastType } from "./types";

export function generateUEID() {
  const first = ("000" + ((Math.random() * 46656) | 0).toString(36)).slice(-3);
  const second = ("000" + ((Math.random() * 46656) | 0).toString(36)).slice(-3);
  return `${first}${second}`;
}

export function useToasts({ placement = "bottom" }: { placement?: Placement }) {
  const index = React.useState(0)[0];
  const [toasts, setToasts] = React.useState<ToastsType>([]);
  const listRef = React.useRef<Array<HTMLElement | null>>([]);

  const data = useFloating({
    placement,
    open: true,
    whileElementsMounted: autoUpdate,
    middleware: [
      inner({
        listRef,
        index,
      }),
    ],
  });

  const addToast: AddToast = (content, options) => {
    const id = options?.id ?? generateUEID();
    const newToast = { id, content, ...options } as ToastType;
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  return React.useMemo(
    () => ({
      listRef,
      index,
      toasts,
      addToast,
      removeToast,
      ...data,
    }),
    [listRef, index, toasts, addToast, removeToast, data]
  );
}

type ContextType = {
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  index: number;
  toasts: ToastsType;
  addToast: AddToast;
  removeToast: (toastId: string) => void;
  refs: ExtendedRefs<any>; // TODO: fix this
  autoDismissTimeout: number;
} & UseFloatingReturn;

const ToastContext = React.createContext<ContextType>(null as any);

export const useToastsContext = () => {
  const context = React.useContext(ToastContext);

  if (context == null) {
    throw new Error("Toast components must be wrapped in <ToastProvider />");
  }

  return context;
};

export function ToastProvider({
  placement,
  autoDismissTimeout = 3000,
  children,
}: {
  placement?: Placement;
  autoDismissTimeout?: number;
  children: React.ReactNode;
}) {
  const context = useToasts({ placement });

  const ref = useMergeRefs([
    context.refs.setReference,
    context.refs.setFloating,
  ]);

  return (
    <ToastContext.Provider value={{ ...context, autoDismissTimeout }}>
      <div ref={ref}>
        {context.toasts.map(
          ({ id, content, appearance, autoDismiss }, index) => (
            <ToastElement
              key={index}
              toastId={id}
              appearance={appearance}
              autoDismiss={autoDismiss}
              ref={(node) => {
                context.listRef.current[index] = node;
              }}
              i={index}
            >
              {content}
            </ToastElement>
          )
        )}
      </div>
      {children}
    </ToastContext.Provider>
  );
}

const getColor = (appearance?: AppearanceTypes) => {
  switch (appearance) {
    case "info":
      return "#CDF0FE";
    case "success":
      return "#ECFCD3";
    case "error":
      return "#FFE2E5";
    case "warning":
      return "#FEFACF";
    default:
      return "#ffffff";
  }
};

const getCountDownColor = (appearance?: AppearanceTypes) => {
  switch (appearance) {
    case "info":
      return "#00B4D8";
    case "success":
      return "#5CB85C";
    case "error":
      return "#D9534F";
    case "warning":
      return "#F0AD4E";
    default:
      return "#ffffff";
  }
};

type ToastContentProps = {
  i: number;
  toastId: string;
  appearance?: AppearanceTypes;
  autoDismiss?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const ToastElement = React.forwardRef<HTMLDivElement, ToastContentProps>(
  ({ i, toastId, appearance, autoDismiss, children }, propRef) => {
    const [timerId, setTimerId] = React.useState<number | null>(null);
    const { context, removeToast, autoDismissTimeout } = useToastsContext();
    const { styles } = useTransitionStyles(context, {
      duration: 300,
      initial: () => ({
        opacity: 0,
      }),
      open: ({ side }) => ({
        opacity: 1,
        transform: {
          top: "translateY(-0.5rem)",
          right: "translateX(0.5rem)",
          bottom: "translateY(0.5rem)",
          left: "translateX(-0.5rem)",
        }[side],
      }),
    });

    const startTimer = React.useCallback(() => {
      const id = setTimeout(() => {
        removeToast(toastId);
      }, autoDismissTimeout);
      setTimerId(id);
    }, [autoDismiss, i, removeToast]);

    const stopTimer = React.useCallback(() => {
      if (timerId) {
        clearTimeout(timerId);
        setTimerId(null);
      }
    }, [timerId]);

    React.useEffect(() => {
      if (autoDismiss) {
        startTimer();
      }
      return () => {
        if (timerId) {
          stopTimer();
        }
      };
    }, []);

    return (
      <FloatingPortal>
        {/* MEMO: css library or ... */}
        <style>
          {`@keyframes autoDismiss {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }`}
        </style>
        <div
          ref={propRef}
          style={{
            width: "300px",
            backgroundColor: getColor(appearance),
            padding: "1rem",
            borderRadius: 8,
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
            position: "absolute",
            right: 0,
            left: 0,
            top: i * 75,
            margin: "auto",
            display: "flex",
            ...styles,
          }}
        >
          {children}
          <div
            style={{ position: "absolute", right: "10px", cursor: "pointer" }}
            onClick={() => {
              removeToast(toastId);
            }}
          >
            {/* TODO: svg icon */}×
          </div>
          <div
            style={{
              animation: `autoDismiss ${autoDismissTimeout}ms linear`,
              backgroundColor: getCountDownColor(appearance),
              position: "absolute",
              height: "3px",
              width: 0,
              top: 0,
              left: 0,
              opacity: autoDismiss ? 1 : 0,
            }}
          />
        </div>
      </FloatingPortal>
    );
  }
);