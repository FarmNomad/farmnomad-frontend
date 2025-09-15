import { baseApi } from "../baseApi";


type CreateSessionResponse = {
  sessionId: string;
  checkoutUrl: string; // New field for the checkout URL
};
type ConfirmResponse = { ok: boolean; orders?: any[]; error?: string };


export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    createSession: b.mutation<CreateSessionResponse, void>({
      query: () => ({ url: "/checkout/create-session", method: "POST" }),
    }),
    confirmSession: b.mutation<ConfirmResponse, { sessionId: string }>({
      query: ({ sessionId }) => ({
        url: `/checkout/confirm?sessionId=${encodeURIComponent(sessionId)}`,
        method: "POST",
      }),
    }),
  }),
});

export const { useCreateSessionMutation, useConfirmSessionMutation } = checkoutApi;
