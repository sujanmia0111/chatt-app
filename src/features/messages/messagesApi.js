import { apiSlice } from "../api/apiSlice";
import io from "socket.io-client";
export const messagesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMessages: builder.query({
            query: (id) =>
                `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
                transformResponse(apiResponse, meta) {
                    const totalCount = meta.response.headers.get("X-Total-Count");
                    return {
                        data: apiResponse,
                        totalCount,
                    };
                },
                async onCacheEntryAdded(
                    arg,
                    { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
                ) {
                    // create socket
                    const socket = io("https://rtk-chat-app-server.herokuapp.com", {
                        reconnectionDelay: 1000,
                        reconnection: true,
                        reconnectionAttemps: 10,
                        transports: ["websocket"],
                        agent: false,
                        upgrade: false,
                        rejectUnauthorized: false,
                    });
    
                    try {
                        await cacheDataLoaded;
                        socket.on("messages", (data) => {
                            updateCachedData((draft) => {
                               
                            if(draft.data[0].conversationId == data?.data.conversationId){

                                draft?.data?.unshift(data?.data)
                            }
                            
                            });
                        });
                    } catch (err) {}
    
                    await cacheEntryRemoved;
                    socket.close();
                },
        }),
        getMoreMessages: builder.query({
            query: ({ id, page }) =>
            `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
            async onQueryStarted({ id }, { queryFulfilled, dispatch }) {
                try {
                    const messages = await queryFulfilled;
                    if (messages?.data?.length > 0) {
                        // update messages cache pessimistically start
                        dispatch(
                            apiSlice.util.updateQueryData(
                                "getMessages",
                                id,
                                (draft) => {
                                    return {
                                        data: [
                                            ...draft.data,
                                            ...messages.data,
                                        ],
                                        totalCount: Number(draft.totalCount),
                                    };
                                }
                            )
                        );
                        // update messages cache pessimistically end
                    }
                } catch (err) {}
            },
        }),
        addMessage: builder.mutation({
            query: (data) => ({
                url: "/messages",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messagesApi;
