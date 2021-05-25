import { dedupExchange, Exchange, fetchExchange } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import {
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { pipe, tap } from "wonka";
import Router from "next/router";

const errorExchange: Exchange =
    ({ forward }) =>
    (ops$) => {
        return pipe(
            forward(ops$),
            tap(({ error }) => {
                // redirect user to login page whenever we see a "not authenticated" error
                // FWIW, I don't love this logic being here. Devs would need to know this is here
                // and nothing really prevents components from handling this differently
                if (error?.message.includes("not authenticated")) {
                    Router.replace("/login");
                }
            })
        );
    };

export const createUrqlClient = (ssrExchange: any) => {
    return {
        url: "http://localhost:4001/graphql",
        fetchOptions: {
            // ensures that cookie is sent
            credentials: "include" as const,
        },
        // If this was my project, I'd probably turn this on so I don't have to deal with caches
        // at all. For now, I'll leave the default so I can learn along with the video
        // requestPolicy: 'network-only',
        exchanges: [
            dedupExchange,
            cacheExchange({
                updates: {
                    Mutation: {
                        // updates the cache whenever these mutations runs
                        // honestly not convinced this is necessary - I feel like there's a better way,
                        // but this is what he did in the video
                        // could maybe just refetch query or invalidate cache or something
                        login: (result_, _args, cache, _info) => {
                            betterUpdateQuery<LoginMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result_,
                                (result, query) => {
                                    if (result.login.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.login.user,
                                        };
                                    }
                                }
                            );
                        },
                        register: (result_, _args, cache, _info) => {
                            betterUpdateQuery<RegisterMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result_,
                                (result, query) => {
                                    if (result.register.errors) {
                                        return query;
                                    } else {
                                        return {
                                            me: result.register.user,
                                        };
                                    }
                                }
                            );
                        },
                        logout: (result_, _args, cache, _info) => {
                            betterUpdateQuery<LogoutMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result_,
                                () => ({ me: null })
                            );
                        },
                    },
                },
            }),
            errorExchange,
            ssrExchange,
            fetchExchange,
        ],
    };
};
