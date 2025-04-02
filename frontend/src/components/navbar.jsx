import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Profile", path: "/" },
    { name: "Inventory", path: "/inventory" },
    { name: "Payout", path: "/payout" },
    { name: "Payout History", path: "/payoutHistory" },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <nav className="flex justify-start py-10 w-full md:w-fit pl-2">
        <div className="flex items-center bg-[#ebf0f7] rounded-lg p-2 shadow-sm">
          <ul className="flex text-xs font-semibold text-nowrap">
            {navItems.map((item, index) => (
              <li key={item.path} className="flex items-center">
                <Link
                  to={item.path}
                  className={`px-10 py-2 font-semibold ${
                    location.pathname === item.path
                      ? "bg-[#bbccdb] rounded-lg"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
                {index < navItems.length - 1 && (
                  <span className="border-r border-gray-400 h-5 mx-2"></span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export { Navbar };
