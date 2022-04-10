import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import CommandPallet from "./command-pallet";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import "./modals";
import ModalProvider from "./modals/ModalProvider";

ReactDOM.render(
  <React.StrictMode>
    <ModalProvider>
      <CommandPallet>
        <App />
      </CommandPallet>
    </ModalProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
