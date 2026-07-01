import { CalendarIcon, MailIcon, MapPinIcon, PhoneIcon } from './VendorIcons.jsx';

const iconByLabel = {
    'Email Address': <MailIcon />,
    'Phone Number': <PhoneIcon />,
    Location: <MapPinIcon />,
    'Member Since': <CalendarIcon />,
};

const VendorProfileInfoCard = ({ items = [] }) => {
    return (
        <section className="vendor-card vendor-profile-info-card">
            <div className="vendor-card-header">
                <h2>Personal Information</h2>
            </div>

            <div className="vendor-profile-info-list">
                {items.map((item) => (
                    <article key={item.label} className="vendor-profile-info-item">
                        <span className={`vendor-profile-info-icon vendor-profile-info-icon--${item.variant || 'blue'}`} aria-hidden="true">
                            {iconByLabel[item.label]}
                        </span>
                        <div>
                            <p className="vendor-profile-info-label">{item.label}</p>
                            <p className="vendor-profile-info-value">{item.value}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default VendorProfileInfoCard;
