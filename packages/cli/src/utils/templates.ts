import { REACT_GRAB_PACKAGE_NAME } from "./constants.js";

export const NEXT_APP_ROUTER_SCRIPT = `{process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/${REACT_GRAB_PACKAGE_NAME}/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}`;

export const VITE_IMPORT = `if (import.meta.env.DEV) {
  import("${REACT_GRAB_PACKAGE_NAME}");
}`;

export const WEBPACK_IMPORT = `if (process.env.NODE_ENV === "development") {
  import("${REACT_GRAB_PACKAGE_NAME}");
}`;

export const TANSTACK_EFFECT = `useEffect(() => {
    if (import.meta.env.DEV) {
      void import("${REACT_GRAB_PACKAGE_NAME}");
    }
  }, []);`;

export const SCRIPT_IMPORT = 'import Script from "next/script";';
