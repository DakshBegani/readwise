import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <GoogleOAuthProvider clientId="447382312160-djdufraeovgi97a6j2m36nelai4vhd7d.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
