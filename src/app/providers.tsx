"use client";

import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { authApi } from "@/lib/redux/services/auth.api";
import { setUser, logout } from "@/lib/redux/slices/auth.slice";
import { useEffect } from "react";

/**
 * On first render (client), if we have a token in localStorage (slice initialState)
 * but no user object yet, fetch /users/me and restore it.
 * If the token is invalid, log out cleanly.
 */
function BootstrapAuth() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) {
      const sub = dispatch(
        authApi.endpoints.me.initiate(undefined, { forceRefetch: true })
      );

      sub
        .unwrap()
        .then((me) => dispatch(setUser(me)))
        .catch(() => {
          // token is present but invalid → clear state
          dispatch(logout());
        });

      return () => sub.unsubscribe();
    }
  }, [token, user, dispatch]);

  return null; // no UI flash; purely side-effect
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BootstrapAuth />
      {children}
    </Provider>
  );
}


// "use client";

// import { Provider } from "react-redux";
// import { store, useAppDispatch, useAppSelector } from "@/lib/redux/store";
// import { setUser, logout } from "@/lib/redux/slices/auth.slice";
// import { useLazyMeQuery } from "@/lib/redux/services/auth.api";
// import { useEffect } from "react";

// function BootstrapAuth() {
//   const dispatch = useAppDispatch();
//   const { token, user } = useAppSelector((s) => s.auth);
//   const [fetchMe] = useLazyMeQuery();

//   useEffect(() => {
//     if (token && !user) {
//       fetchMe()
//         .unwrap()
//         .then((me) => dispatch(setUser(me)))
//         .catch(() => dispatch(logout()));
//     }
//   }, [token, user, fetchMe, dispatch]);

//   return null;
// }

// export default function Providers({ children }: { children: React.ReactNode }) {
//   return (
//     <Provider store={store}>
//       <BootstrapAuth />
//       {children}
//     </Provider>
//   );
// }
