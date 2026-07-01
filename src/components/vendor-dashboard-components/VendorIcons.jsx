const iconProps = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
};

export const TagIcon = () => (
    <svg {...iconProps}>
        <path d="M20 10.6 13.4 4H4v9.4L10.6 20a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8Z" />
        <circle cx="7.8" cy="7.8" r="1.4" />
    </svg>
);

export const ImageIcon = () => (
    <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m21 16-5-5-6 6" />
    </svg>
);

export const PlusIcon = () => (
    <svg {...iconProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);

export const DollarIcon = () => (
    <svg {...iconProps}>
        <path d="M12 3v18" />
        <path d="M16.5 7.5A3.5 3.5 0 0 0 13 5h-2a3 3 0 0 0 0 6h2a3 3 0 1 1 0 6h-2a3.5 3.5 0 0 1-3.5-2.5" />
    </svg>
);

export const BagIcon = () => (
    <svg {...iconProps}>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
);

export const CubeIcon = () => (
    <svg {...iconProps}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="m4 7.5 8 4.5 8-4.5" />
        <path d="M12 12v9" />
    </svg>
);

export const EyeIcon = () => (
    <svg {...iconProps}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="2.5" />
    </svg>
);

export const MailIcon = () => (
    <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
    </svg>
);

export const PhoneIcon = () => (
    <svg {...iconProps}>
        <path d="M15 20c-5.5-2.2-8.8-5.5-11-11l2.8-2.8 2.8 1.4-.7 3.1a12.2 12.2 0 0 0 4.4 4.4l3.1-.7 1.4 2.8L15 20Z" />
    </svg>
);

export const MapPinIcon = () => (
    <svg {...iconProps}>
        <path d="M12 21s6-5.9 6-11a6 6 0 1 0-12 0c0 5.1 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
    </svg>
);

export const CalendarIcon = () => (
    <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M3 10h18" />
    </svg>
);
