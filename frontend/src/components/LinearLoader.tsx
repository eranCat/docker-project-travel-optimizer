import { useEffect, useState } from "react";

interface Props {
  loading: boolean;
}

const LinearLoader = ({ loading }: Props) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + Math.random() * 10, 95); // simulate slow fill to 95%
      setProgress(current);
    }, 100);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div style={{ marginTop: "1rem", height: "6px", width: "100%", backgroundColor: "#eee", borderRadius: "4px" }}>
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          backgroundColor: "#2f80ed",
          borderRadius: "4px",
          transition: "width 0.2s ease-out",
        }}
      />
    </div>
  );
};

export default LinearLoader;
