import axios from "axios";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import "./NewForum.css";

const NewForum = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const navigate = useNavigate();

  const user = useSelector((state: any) => state.auth.user.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your new forum logic here
    try {
      const { data } = await axios.post("http://localhost:3000/posts", {
        title,
        description,
        user_id: user.id,
      });

      console.log("New forum created:", data);
      navigate("/forums");
    } catch (error) {
      console.error("Error creating forum:", error);
    }
  };
  return (
    <div className="new-forum">
      <h1>New Discussion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <button type="submit">Start Discussion</button>
      </form>
    </div>
  );
};

export default NewForum;
