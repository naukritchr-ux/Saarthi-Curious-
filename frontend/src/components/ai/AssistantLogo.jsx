export default function AssistantLogo({ size = 22 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="goldS" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
            </defs>
            <path
                d="M27 12.5
           C27 10.2 24.2 8.5 20.5 8.5
           C16.2 8.5 13 10.7 13 14
           C13 17.2 15.2 18.8 20 19.8
           C24.8 20.8 27.5 22.4 27.5 25.5
           C27.5 28.7 24.2 31 19.5 31
           C15.3 31 12.5 29.4 12.5 27.2"
                fill="none"
                stroke="url(#goldS)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}