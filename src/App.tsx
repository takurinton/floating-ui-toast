import { ToastProvider, useToastsContext } from "./ft";
import { Options } from "./ft/types";

const Component = () => {
  const { addToast } = useToastsContext();

  const handleClick = (text: string, type: Options) => () => {
    addToast(text, type);
  };

  return (
    <div>
      <button
        onClick={handleClick("info", { appearance: "info", autoDismiss: true })}
      >
        Add Info(autoDismiss)
      </button>
      <button onClick={handleClick("info", { appearance: "info" })}>
        Add Info(no autoDismiss)
      </button>
      <button onClick={handleClick("success", { appearance: "success" })}>
        Add Success
      </button>
      <button onClick={handleClick("warning", { appearance: "warning" })}>
        Add Warning
      </button>
      <button onClick={handleClick("error", { appearance: "error" })}>
        Add Error
      </button>
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <Component />
    </ToastProvider>
  );
}

export default App;
