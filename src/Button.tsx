const Button = ({ children }: { children: React.ReactNode }) => (
  <button
    style={{
      border: "orange solid 2px",
    }}
  >
    {children}
  </button>
);
export default Button;
