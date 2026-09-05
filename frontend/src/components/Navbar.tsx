import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/slices/authReducer";
import { Link, useNavigate } from "react-router";
import "./Navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user.user);
  const handleLogout = async () => {
    dispatch(logout());
    navigate("/");
  };
  return (
    <nav>
      <div className="logo">
        <h1 onClick={() => navigate("/forums")}>DevNest</h1>
      </div>
      <div className="links">
        <Link to={"/forums/history"}>{user.username}</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;

