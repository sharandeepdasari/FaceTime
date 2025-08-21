import { useNavigate } from "react-router-dom";

export default function GetStarted({title}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/authentication")}
    >
        {title}
    </button>
  );
}

