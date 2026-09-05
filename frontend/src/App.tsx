import React, { useEffect, useState } from "react";
import { FaRegThumbsUp, FaRegThumbsDown } from "react-icons/fa";
import { request } from "./api";
import "./index.css";
type User = {
  id: number;
  username: string;
  email: string;
  skills: string[];
  experiences: string[];
};
type Reaction = { likes: number; dislikes: number };
type Comment = {
  id: number;
  content: string;
  author: User;
  reactions: Reaction;
  myReaction?: string | null;
  replies: Comment[];
};
type Post = {
  id: number;
  title: string;
  description: string;
  author: User;
  reactions: Reaction;
  myReaction?: string | null;
  commentCount: number;
  score: number;
  created_at: string;
  comments?: Comment[];
};
const ReactionButtons = ({
  target,
  id,
  initial,
  selected,
}: {
  target: "post" | "comment";
  id: number;
  initial: Reaction;
  selected?: string | null;
}) => {
  const [r, setR] = useState(initial),
    [mine, setMine] = useState<string | null>(selected ?? null);
  useEffect(() => {
    setR(initial);
    setMine(selected ?? null);
  }, [id, initial.likes, initial.dislikes, selected]);
  const react = async (type: string) => {
    const d = await request<{ reactions: Reaction; myReaction: string | null }>(
      "put",
      `/reactions/${target}/${id}`,
      { type },
    );
    setR(d.reactions);
    setMine(d.myReaction);
  };
  return (
    <span className="react">
      <button
        className={mine === "like" ? "active-like" : ""}
        aria-label="Like"
        title="Like"
        onClick={() => react("like")}
      >
        <FaRegThumbsUp /> <span>{r.likes}</span>
      </button>
      <button
        className={mine === "dislike" ? "active-dislike" : ""}
        aria-label="Dislike"
        title="Dislike"
        onClick={() => react("dislike")}
      >
        <FaRegThumbsDown /> <span>{r.dislikes}</span>
      </button>
    </span>
  );
};
const Auth = ({ onDone }: { onDone: (u: User) => void }) => {
  const [signup, setSignup] = useState(false),
    [error, setError] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const d = await request<{ user: User; accessToken: string }>(
        "post",
        signup ? "/auth/signup" : "/auth/login",
        Object.fromEntries(f),
      );
      localStorage.setItem("devnest_token", d.accessToken);
      onDone(d.user);
    } catch {
      setError("Could not sign in. Check your details and try again.");
    }
  };
  return (
    <main className="auth">
      <section className="panel">
        <p className="eyebrow">DevNest</p>
        <h1>{signup ? "Join the nest" : "Welcome back"}</h1>
        <p>Share ideas, get thoughtful feedback, and grow with developers.</p>
        <form onSubmit={submit}>
          {signup && <input required name="username" placeholder="Your name" />}
          <input
            required
            name="email"
            type="email"
            placeholder="Email address"
          />
          <input
            required
            name="password"
            type="password"
            minLength={6}
            placeholder="Password (6+ characters)"
          />
          {error && <p className="error">{error}</p>}
          <button className="primary">
            {signup ? "Create account" : "Log in"}
          </button>
        </form>
        <button className="link" onClick={() => setSignup(!signup)}>
          {signup
            ? "Already have an account? Log in"
            : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
};
const Comments = ({
  post,
  onRefresh,
  currentUserId,
}: {
  post: Post;
  onRefresh: () => void;
  currentUserId: number;
}) => {
  const [text, setText] = useState(""),
    [error, setError] = useState("");
  const add = async (parentId?: number) => {
    if (!text.trim()) return;
    try {
      await request("post", `/posts/${post.id}/comments`, {
        content: text,
        parentId,
      });
      setText("");
      setError("");
      onRefresh();
    } catch {
      setError("Could not save your comment. Please try again.");
    }
  };
  const edit = async (c: Comment) => {
    const content = prompt("Edit your comment", c.content);
    if (content === null || content.trim() === c.content) return;
    try {
      await request("put", `/comments/${c.id}`, { content });
      onRefresh();
    } catch {
      setError("Could not update this comment.");
    }
  };
  const remove = async (c: Comment) => {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    try {
      await request("delete", `/comments/${c.id}`);
      onRefresh();
    } catch {
      setError("Could not delete this comment.");
    }
  };
  const Tree = ({ c }: { c: Comment }) => (
    <div className="comment">
      <b>{c.author.username}</b>
      <p>{c.content}</p>
      <ReactionButtons
        target="comment"
        id={c.id}
        initial={c.reactions}
        selected={c.myReaction}
      />
      <button
        className="mini"
        onClick={() => {
          const x = prompt("Reply to this comment");
          if (x)
            request("post", `/posts/${post.id}/comments`, {
              content: x,
              parentId: c.id,
            }).then(onRefresh);
        }}
      >
        Reply
      </button>
      {c.author.id === currentUserId && (
        <>
          <button className="mini" onClick={() => edit(c)}>
            Edit
          </button>
          <button className="mini danger" onClick={() => remove(c)}>
            Delete
          </button>
        </>
      )}
      {c.replies.map((x) => (
        <Tree c={x} key={x.id} />
      ))}
    </div>
  );
  return (
    <section className="comments">
      <h3>Conversation</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a thoughtful comment"
      />
      <button className="primary" onClick={() => add()}>
        Comment
      </button>
      {error && <p className="error">{error}</p>}
      {post.comments?.map((c) => (
        <Tree c={c} key={c.id} />
      ))}
    </section>
  );
};
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [posts, setPosts] = useState<Post[]>([]),
    [open, setOpen] = useState<Post | null>(null),
    [publicProfile, setPublicProfile] = useState<User | null>(null),
    [view, setView] = useState<"feed" | "create" | "profile">("feed"),
    [editingPost, setEditingPost] = useState(false),
    [loading, setLoading] = useState(true);
  const load = () =>
    request<Post[]>("get", "/posts")
      .then(setPosts)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, [user?.id]);
  useEffect(() => {
    if (localStorage.getItem("devnest_token"))
      request<User>("get", "/auth/me")
        .then(setUser)
        .catch(() => localStorage.removeItem("devnest_token"));
  }, []);
  if (!user) return <Auth onDone={setUser} />;
  const viewProfile = async (id: number) => {
    setPublicProfile(await request<User>("get", `/auth/${id}`));
    setOpen(null);
    setView("feed");
  };
  const detail = async (p: Post) => {
    setOpen(await request<Post>("get", `/posts/${p.id}`));
    setEditingPost(false);
    setView("feed");
  };
  const profile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      list = (x: string) =>
        x
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
    const u = await request<User>("put", "/auth/me", {
      name: f.get("name"),
      skills: list(String(f.get("skills"))),
      experiences: list(String(f.get("experiences"))),
    });
    setUser(u);
    setView("feed");
  };
  return (
    <>
      <nav className="topbar">
        <strong
          onClick={() => {
            setOpen(null);
            setView("feed");
          }}
        >
          DevNest
        </strong>
        <span className="user-pill">{user.username}</span>
        <button onClick={() => setView("profile")}>Profile</button>
        <button onClick={() => setView("create")}>New post</button>
        <button
          onClick={() => {
            localStorage.removeItem("devnest_token");
            setUser(null);
          }}
        >
          Logout
        </button>
      </nav>
      <main>
        {publicProfile ? (
          <section className="panel public-profile">
            <button className="link" onClick={() => setPublicProfile(null)}>
              ← Back to feed
            </button>
            <p className="eyebrow">Developer profile</p>
            <h1>{publicProfile.username}</h1>
            <p className="meta">{publicProfile.email}</p>
            <h3>Skills</h3>
            <div className="tags">
              {publicProfile.skills?.length ? (
                publicProfile.skills.map((s) => <span key={s}>{s}</span>)
              ) : (
                <em>No skills added yet.</em>
              )}
            </div>
            <h3>Experience</h3>
            <ul>
              {publicProfile.experiences?.length ? (
                publicProfile.experiences.map((x) => <li key={x}>{x}</li>)
              ) : (
                <li>No experience added yet.</li>
              )}
            </ul>
          </section>
        ) : view === "profile" ? (
          <section className="panel">
            <h1>Your developer profile</h1>
            <form onSubmit={profile}>
              <input name="name" defaultValue={user.username} />
              <input
                name="skills"
                defaultValue={user.skills?.join(", ")}
                placeholder="Skills: React, Node.js"
              />
              <textarea
                name="experiences"
                defaultValue={user.experiences?.join(", ")}
                placeholder="Experiences, comma-separated"
              />
              <button className="primary">Save profile</button>
            </form>
          </section>
        ) : view === "create" ? (
          <Create
            onDone={() => {
              setView("feed");
              load();
            }}
          />
        ) : open ? (
          <section>
            <button
              className="link"
              onClick={() => {
                setOpen(null);
                setEditingPost(false);
              }}
            >
              ← Back to feed
            </button>
            <article className="post detail">
              {editingPost ? (
                <EditPost
                  post={open}
                  onDone={() => detail(open)}
                  onCancel={() => setEditingPost(false)}
                />
              ) : (
                <>
                  <h1>{open.title}</h1>
                  <p className="meta">
                    by{" "}
                    <button
                      className="author-link"
                      onClick={() => viewProfile(open.author.id)}
                    >
                      {open.author.username}
                    </button>
                  </p>
                  <p>{open.description}</p>
                  <ReactionButtons
                    target="post"
                    id={open.id}
                    initial={open.reactions}
                    selected={open.myReaction}
                  />
                  {open.author.id === user.id && (
                    <span className="owner-actions">
                      <button className="mini" onClick={() => setEditingPost(true)}>
                        Edit post
                      </button>
                      <button
                        className="mini danger"
                        onClick={async () => {
                          if (!confirm("Delete this post and its discussion?")) return;
                          await request("delete", `/posts/${open.id}`);
                          setOpen(null);
                          load();
                        }}
                      >
                        Delete post
                      </button>
                    </span>
                  )}
                  <Comments
                    post={open}
                    currentUserId={user.id}
                    onRefresh={() => detail(open)}
                  />
                </>
              )}
            </article>
          </section>
        ) : (
          <>
            <header className="hero">
              <div>
                <p className="eyebrow">Developer community</p>
                <h1>Build better, together.</h1>
                <p className="hero-copy">
                  A calm space for developers to share ideas, solve problems
                  and learn in public.
                </p>
              </div>
              <div className="hero-stat">
                <strong>{posts.length}</strong>
                <span>active discussions</span>
              </div>
            </header>
            {loading ? (
              <p>Loading discussions…</p>
            ) : posts.length ? (
              posts.map((p) => (
                <article className="post" key={p.id}>
                  <h2 onClick={() => detail(p)}>{p.title}</h2>
                  <p className="meta">
                    <span>
                      by{" "}
                      <button
                        className="author-link"
                        onClick={() => viewProfile(p.author.id)}
                      >
                        {p.author.username}
                      </button>
                    </span>
                    <span>·</span>
                    <span>{p.commentCount} comments</span>
                    <span>·</span>
                    <span>score {p.score}</span>
                  </p>
                  <p>{p.description}</p>
                  <ReactionButtons
                    target="post"
                    id={p.id}
                    initial={p.reactions}
                    selected={p.myReaction}
                  />
                  <button className="mini" onClick={() => detail(p)}>
                    Open discussion
                  </button>
                </article>
              ))
            ) : (
              <p className="empty">
                No posts yet. Start the first conversation.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
const Create = ({ onDone }: { onDone: () => void }) => {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await request("post", "/posts", {
      title: f.get("title"),
      description: f.get("description"),
    });
    onDone();
  };
  return (
    <section className="panel">
      <h1>Start a discussion</h1>
      <form onSubmit={submit}>
        <input name="title" required placeholder="Clear, useful title" />
        <textarea
          name="description"
          required
          placeholder="What are you building or learning?"
        />
        <button className="primary">Publish post</button>
      </form>
    </section>
  );
};

const EditPost = ({
  post,
  onDone,
  onCancel,
}: {
  post: Post;
  onDone: () => void;
  onCancel: () => void;
}) => {
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await request("put", `/posts/${post.id}`, {
        title: f.get("title"),
        description: f.get("description"),
      });
      onDone();
    } catch {
      setError("Could not update this post. Please check the fields and retry.");
    }
  };
  return (
    <>
      <h1>Edit discussion</h1>
      <form onSubmit={submit}>
        <input name="title" required maxLength={255} defaultValue={post.title} />
        <textarea
          name="description"
          required
          maxLength={5000}
          defaultValue={post.description}
        />
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button className="primary">Save changes</button>
          <button type="button" className="mini" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};
