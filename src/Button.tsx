const Button = ({ children }: { children: React.ReactNode }) => (
  <button
    style={{
      border: "orange solid 2px",
    }}
  >
    {children} 123
  </button>
);
export default Button;
