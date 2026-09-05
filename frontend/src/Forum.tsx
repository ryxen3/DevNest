import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import Comments from "./components/Comments";
import "./Forum.css";
import { FaArrowUp } from "react-icons/fa";

interface Forum {
  id: number;
  title: string;
  description: string;
  created_at: string;
  user_id: number;
  username: string;
  upvotesCount: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  email: string;
}

const Forum = () => {
  // read param from url
  const params = useParams();
  const [forum, setForum] = useState<Forum | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState("");

  const user = useSelector((state: any) => state.auth.user.user);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/comments/${id}`);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== id)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleEditClick = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditedContent("");
  };

  const handleEditSave = async () => {
    if (!editingCommentId) return;
    try {
      await axios.put(`http://localhost:3000/comments/${editingCommentId}`, {
        content: editedContent,
      });

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, content: editedContent }
            : comment
        )
      );

      setEditingCommentId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleUpvote = async (postId: number) => {
    if (!forum || !user || isVoting) return;
    setIsVoting(true);
    setVoteError("");
    try {
      const response = hasUpvoted
        ? await axios.delete("http://localhost:3000/upvote", { data: { post_id: postId, user_id: user.id } })
        : await axios.post("http://localhost:3000/upvote", { post_id: postId, user_id: user.id });
      setForum((current) => current ? { ...current, upvotesCount: Number(response.data.upvotesCount) } : current);
      setHasUpvoted(Boolean(response.data.hasUpvoted));
    } catch (error) {
      console.error("Upvote toggle failed:", error);
      setVoteError("Could not save your upvote. Please make sure the API is running.");
    } finally {
      setIsVoting(false);
    }
  };
  const fetchForum = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:3000/posts/${params.id}?user_id=${user.id}`
      );

      console.log("Forum data:", data);
      console.log("Forum data:", typeof data);
      console.log(typeof data["upvotesCount"]);
      console.log("Forum data:", data["upvotesCount"]);
      console.log("has upvoted:", data.hasUpvoted);

      setForum({ ...data.post, upvotesCount: Number(data.upvotesCount) });
      setComments(data.comments);
      setHasUpvoted(data.hasUpvoted);
    } catch (error) {
      console.error("Error fetching forum:", error);
    }
  };

  useEffect(() => {
    fetchForum();
  }, [user.id, params.id]);

  return (
    <div>
      <div className="forum-container">
        <h2>DevNest discussion</h2>
        {forum && (
          <div key={forum.id} className="forum-card">
            <h2>{forum.title}</h2>
            <div className="forum-card-body">
              <div className="forum-card-header">
                <p>{forum.username} on</p>
                <p>
                  {new Date(forum.created_at).toLocaleDateString("en-us", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <p>{forum.description}</p>
              <button type="button" aria-pressed={hasUpvoted} disabled={isVoting} onClick={() => handleUpvote(forum.id)} className={`forum-upvotes ${hasUpvoted ? "is-upvoted" : ""}`}>
                <FaArrowUp color={hasUpvoted ? "orange" : "gray"} />{" "}
                {isVoting ? "Saving..." : `${forum.upvotesCount} ${hasUpvoted ? "Upvoted" : "Upvote"}`}
              </button>
              {voteError && <p className="vote-error">{voteError}</p>}
            </div>
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="comment-card">
            {editingCommentId === comment.id ? (
              <div className="comment-card-edit">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <br />
                <div>
                  <button onClick={handleEditSave}>Save</button>
                  <button onClick={handleEditCancel}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="comment-card-body">
                <div className="comment-card-header">
                  <div>
                    <p>{comment.username} replied on</p>
                    <p>
                      {new Date(comment.created_at).toLocaleDateString(
                        "en-us",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  {comment.user_id === user.id && (
                    <div>
                      <button onClick={() => handleEditClick(comment)}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(comment.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <p>{comment.content}</p>
              </div>
            )}
          </div>
        ))}
        <Comments onCommentSubmit={fetchForum} />
      </div>
    </div>
  );
};

export default Forum;








