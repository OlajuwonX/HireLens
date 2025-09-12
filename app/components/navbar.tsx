import {Link} from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/" >
                <p className=" flex text-2xl font-bold text-gradient cursor-pointer relative z-1">
                  <img src="/hllogo.png" alt="Logo" className="h-9 w-11 px-1 rounded-sm"/>
                    HireLens
                </p>
            </Link>
            <Link to="/upload" className="primary-button w-fit cursor-pointer relative z-1">
                Upload Resume
            </Link>
        </nav>
    )
}
export default Navbar
