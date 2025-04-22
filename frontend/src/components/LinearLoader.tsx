const LinearLoader = () => {
    return (
        <div style={{ marginTop: "1rem", height: "4px", width: "100%", backgroundColor: "#eee", overflow: "hidden", borderRadius: "2px" }}>
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    backgroundColor: "#2f80ed",
                    animation: "loading-bar 1.5s infinite linear",
                }}
            />
            <style>
                {`
          @keyframes loading-bar {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
            </style>
        </div>
    );
};

export default LinearLoader;
