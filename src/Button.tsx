const Button = ({ children }: { children: React.ReactNode }) => (
  <button className="border-2 border-orange-500 px-4 py-2 rounded hover:bg-orange-50 transition-colors">
    {children}
  </button>
);
export default Button;
