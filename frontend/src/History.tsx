import { useEffect, useState } from "react";
import "./History.css";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router";

const History = () => {
  const user = useSelector((state: any) => state.auth.user.user);
  const [history, setHistory] = useState<any>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await axios.get(
          `http://localhost:3000/auth/history?user_id=${user.id}`
        );

        console.log("history: ", data.history);
        setHistory(data.history);
      } catch (error) {
        console.error("Error getting the history");
      }
    }
    fetchHistory();
  }, []);
  return (
    <div className="history">
      <h2>History</h2>
      {history && (
        <div>
          {history.map((his: any) => (
            <div key={his.id}>
              {his.type === "comment" && (
                <p>
                  You commented on{" "}
                  {his.postAuthor === user.username
                    ? "your "
                    : `${his.postAuthor}'s `}
                  post titled "
                  <Link to={`/forums/${his.postId}`}>{his.postTitle}</Link>"" on{" "}
                  {new Date(his.created_at).toLocaleString("en-us", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              {his.type === "post" && (
                <p>
                  You created a post titled "
                  <Link to={`/forums/${his.id}`}>{his.title}</Link>" on{" "}
                  {new Date(his.created_at).toLocaleString("en-us", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              {his.type === "upvote" && (
                <p>
                  You upvoted{" "}
                  {his.postAuthor === user.username
                    ? "your "
                    : `${his.postAuthor}'s `}{" "}
                  post titled "
                  <Link to={`/forums/${his.postId}`}>{his.postTitle}</Link>" on{" "}
                  {new Date(his.created_at).toLocaleString("en-us", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
