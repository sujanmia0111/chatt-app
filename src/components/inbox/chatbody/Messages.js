import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { messagesApi } from "../../../features/messages/messagesApi";
import Message from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";

export default function Messages({ messages = [], totalCount, id }) {
  const { user } = useSelector((state) => state.auth) || {};
  const { email } = user || {};
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();

  const fetchMore = () => {
    setPage((prevPage) => prevPage + 1);
  };
  useEffect(() => {
   
    if (page > 1) {
      dispatch(
        messagesApi.endpoints.getMoreMessages.initiate({
          id,
          page,
        })
      );
    }
  }, [page, id, dispatch]);

  useEffect(() => {
    if (totalCount > 0) {
      const more =
        Math.ceil(
          totalCount / Number(process.env.REACT_APP_MESSAGES_PER_PAGE)
        ) > page;

      setHasMore(more);
    }
  }, [totalCount, page]);

  return (
    <div
      id="scrollableDiv"
      className="relative w-full h-[calc(100vh_-_197px)] p-6   flex flex-col-reverse"
    >
      <InfiniteScroll
     
        dataLength={messages.length}
        next={fetchMore}
        style={{ display: "flex", flexDirection: "column-reverse"}}
        hasMore={hasMore}
        loader={<div className="loading">Loading ...</div>}
        height={window.innerHeight - 197}
        endMessage={<span />}
        pullDownToRefreshThreshold={50}
        refreshFunction={fetchMore}
        pullDownToRefresh={true}
        inverse={true} 
        scrollableTarget="scrollableDiv"
      >
        <ul className="space-y-2">
          {messages
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => {
              const { message: lastMessage, id, sender } = message || {};

              const justify = sender.email !== email ? "start" : "end";

              return (
                <Message key={id} justify={justify} message={lastMessage} />
              );
            })}
        </ul>
      </InfiniteScroll>
    </div>
  );
}
