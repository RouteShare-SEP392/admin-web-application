"use client";

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { useState, type ReactNode } from "react";

/** Phiên hết hạn (cookie mất hoặc JWT bị backend từ chối): quay về trang đăng nhập. */
const fetchWithSessionCheck: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    // Tải lại toàn trang để xoá dữ liệu của phiên đã hết hạn khỏi bộ nhớ.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
  return response;
};

function createClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: "/api/graphql", fetch: fetchWithSessionCheck }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}

export function ApolloClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createClient);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
