import { Link, Outlet } from "react-router-dom";

function App() {
  return (
    <div>
      <header>
        <Link to="/">Home</Link>
        <Link to="/otherpage">Other Page</Link>
      </header>
      <Outlet />
    </div>
  );
}
export default App;
