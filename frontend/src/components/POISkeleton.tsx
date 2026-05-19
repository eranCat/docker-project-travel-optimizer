import { Box, Skeleton } from "@mui/material";

export default function POISkeleton({ count = 4 }: { count?: number }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {Array.from({ length: count }).map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 3,
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        opacity: 1 - i * 0.15,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Skeleton variant="circular" width={26} height={26} />
                        <Skeleton variant="text" sx={{ flex: 1 }} height={18} />
                    </Box>
                    <Skeleton variant="text" sx={{ ml: "34px" }} height={14} width="75%" />
                    <Skeleton variant="text" sx={{ ml: "34px" }} height={12} width="55%" />
                    <Box sx={{ display: "flex", gap: 0.75, ml: "34px", mt: 0.25 }}>
                        <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: 20 }} />
                        <Skeleton variant="rounded" width={48} height={22} sx={{ borderRadius: 20 }} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}
