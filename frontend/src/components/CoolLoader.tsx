const CoolLoader = () => (
    <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <div className="spinner" />
        <style>
            {`
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--input-border);
        border-top: 4px solid var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: auto;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}
        </style>
    </div>
);

export default CoolLoader;