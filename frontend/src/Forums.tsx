import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router";
import "./Forums.css";
import { FaArrowUp } from "react-icons/fa";

interface Forums {
  id: number;
  title: string;
  description: string;
  user_id: number;
  created_at: string;
  username: string;
  email: string;
  upvotes: number;
}

const Forums = () => {
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user.user);

  const [forums, setForums] = useState<Forums[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const limit = 5;
  const page = parseInt(searchParams.get("page") || "1");

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3000/posts/${id}`);
      setForums((prevForums) => prevForums.filter((forum) => forum.id !== id));
      navigate("/forums");
    } catch (error) {
      console.error("Error deleting forum:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  useEffect(() => {
    const fetchForums = async () => {
      try {
        const response = await axios.get("http://localhost:3000/posts", {
          params: { page, limit },
        });
        const data = response.data;
        console.log("Forums data:", data);
        setForums(data.forums);
        setTotalPages(Math.ceil(data.totalCount / limit));
      } catch (error) {
        console.error("Error fetching forums:", error);
      }
    };
    fetchForums();
  }, [page]);
  return (
    <main>
      <div className="header">
        <label htmlFor="forums">Forums</label>
        <Link to={"/forums/new"}>Start New discussion</Link>
      </div>
      {forums &&
        forums.map((forum) => (
          <div key={forum.id} className="forums">
            <div className="upvotes">
              <FaArrowUp />
              {forum.upvotes}
            </div>
            <div className="card-body">
              <div className="card-header">
                <div>
                  <h2 onClick={() => navigate(`/forums/${forum.id}`)}>
                    {forum.title}
                  </h2>
                </div>
                {forum.user_id === user.id ? (
                  <div className="action-buttons">
                    <button
                      onClick={() => navigate(`/forums/${forum.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(forum.id)}>
                      Delete
                    </button>
                  </div>
                ) : (
                  ""
                )}
              </div>
              <div className="card-footer">
                <p>{forum.username} asked on</p>
                <p>
                  {new Date(forum.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default Forums;
