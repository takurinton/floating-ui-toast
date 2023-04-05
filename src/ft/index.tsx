import {
  ElementProps,
  ExtendedRefs,
  FloatingFocusManager,
  inner,
  Placement,
  useClick,
  useDismiss,
  useFloating,
  UseFloatingReturn,
  useHover,
  useInteractions,
  useListNavigation,
  useTransitionStyles,
} from "@floating-ui/react";
import * as React from "react";
import { AddToast, AppearanceTypes, ToastsType, ToastType } from "./types";

export function generateUEID() {
  const first = ("000" + ((Math.random() * 46656) | 0).toString(36)).slice(-3);
  const second = ("000" + ((Math.random() * 46656) | 0).toString(36)).slice(-3);
  return `${first}${second}`;
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

export function useToasts({ placement = "bottom" }: { placement?: Placement }) {
  const [index, setIndex] = React.useState<number | null>(0);
  const [toasts, setToasts] = React.useState<ToastsType>([]);
  const listRef = React.useRef<Array<HTMLElement | null>>([]);

  const data = useFloating({
    placement,
    open: true,
    middleware: [
      inner({
        listRef,
        index: index ?? 0,
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

  const click = useClick(data.context);
  const hover = useHover(data.context);
  const dismiss = useDismiss(data.context);
  const listNavigation = useListNavigation(data.context, {
    listRef,
    activeIndex: index,
    onNavigate: setIndex,
  });

  return React.useMemo(
    () => ({
      listRef,
      index,
      toasts,
      click,
      hover,
      dismiss,
      listNavigation,
      setIndex,
      addToast,
      removeToast,
      ...data,
    }),
    [
      listRef,
      index,
      toasts,
      click,
      hover,
      dismiss,
      listNavigation,
      setIndex,
      addToast,
      removeToast,
      data,
    ]
  );
}

type ContextType = {
  listRef: React.MutableRefObject<Array<HTMLElement | null>>;
  index: number | null;
  toasts: ToastsType;
  click: ElementProps;
  hover: ElementProps;
  setIndex: (index: number) => void;
  dismiss: ElementProps;
  listNavigation: ElementProps;
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
  const { getFloatingProps } = useInteractions([
    context.dismiss,
    context.click,
    context.hover,
    context.listNavigation,
  ]);

  return (
    <ToastContext.Provider value={{ ...context, autoDismissTimeout }}>
      <FloatingFocusManager context={context.context}>
        <ul
          ref={context.refs.setFloating}
          role="region"
          aria-live="polite"
          style={{
            position: context.strategy,
            // TODO: dynamic style from placement prop
            left: "50%",
            transform: "translateX(-50%)",
            // remove default ul padding, margin
            padding: 0,
            margin: 0,
          }}
          {...getFloatingProps()}
        >
          {context.toasts.map(
            ({ id, content, appearance, autoDismiss }, index) => (
              <ToastElement
                idx={index}
                key={index}
                toastId={id}
                appearance={appearance}
                autoDismiss={autoDismiss}
                ref={(node) => {
                  context.listRef.current[index] = node;
                }}
              >
                {content}
              </ToastElement>
            )
          )}
        </ul>
      </FloatingFocusManager>
      {children}
    </ToastContext.Provider>
  );
}

type ToastContentProps = {
  idx: number;
  toastId: string;
  appearance?: AppearanceTypes;
  autoDismiss?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const ToastElement = React.forwardRef<HTMLLIElement, ToastContentProps>(
  ({ idx, toastId, appearance, autoDismiss, children }, propRef) => {
    const [timerId, setTimerId] = React.useState<number | undefined>();
    const [isRunning, setIsRunning] = React.useState(false);
    const {
      context,
      removeToast,
      autoDismissTimeout,
      dismiss,
      click,
      hover,
      listNavigation,
    } = useToastsContext();
    const { getItemProps } = useInteractions([
      dismiss,
      click,
      hover,
      listNavigation,
    ]);
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

    React.useEffect(() => {
      if (isRunning && autoDismiss) {
        const id = setTimeout(() => {
          removeToast(toastId);
        }, autoDismissTimeout);
        setTimerId(id);
      }
      return () => {
        isRunning && autoDismiss && clearTimeout(timerId);
      };
    }, [isRunning]);

    const startTimer = () => {
      setIsRunning(true);
    };

    const stopTimer = () => {
      setIsRunning(false);
      clearTimeout(timerId);
    };

    const resumeTimer = () => {
      setIsRunning(true);
    };

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

    // for timeout progress bar
    React.useEffect(() => {
      if (autoDismiss && !document.getElementById("autoDismissStyle")) {
        const style = document.createElement("style");
        Object.assign(style, {
          id: "autoDismissStyle",
          innerHTML: `@keyframes autoDismiss {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }`,
        });
        document.head.appendChild(style);
      }
    });

    return (
      <li
        className={toastId}
        ref={propRef}
        role="status"
        aria-atomic="true"
        aria-hidden="false"
        tabIndex={0}
        style={{
          width: "300px",
          backgroundColor: getColor(appearance),
          padding: "1rem",
          marginBottom: "1rem",
          borderRadius: 8,
          boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
          display: "flex",
          ...styles,
        }}
        {...getItemProps({
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              removeToast(toastId);
            }
          },
          onFocus: () => {
            if (autoDismiss) {
              stopTimer();
            }
          },
          onBlur: () => {
            if (autoDismiss) {
              resumeTimer();
            }
          },
          onMouseOver: () => {
            if (autoDismiss) {
              stopTimer();
            }
          },
          onMouseLeave: () => {
            if (autoDismiss) {
              resumeTimer();
            }
          },
        })}
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
            animationPlayState: isRunning ? "running" : "paused",
          }}
        />
      </li>
    );
  }
);
