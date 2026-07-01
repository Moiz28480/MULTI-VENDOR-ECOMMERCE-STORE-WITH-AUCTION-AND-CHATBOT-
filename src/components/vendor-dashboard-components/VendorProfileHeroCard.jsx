const VendorProfileHeroCard = ({ shopName, shopLogo, roleLabel = 'User' }) => {
    return (
        <section className="vendor-profile-hero-card">
            <div className="vendor-profile-hero-strip" />
            <div className="vendor-profile-hero-body">
                <div className="vendor-profile-logo-wrap">
                    {shopLogo ? (
                        <img src={shopLogo} alt={`${shopName} logo`} className="vendor-profile-logo" />
                    ) : (
                        <div className="vendor-profile-logo vendor-profile-logo--fallback" aria-hidden="true">
                            {String(shopName || 'V').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div>
                    <div className="vendor-profile-shop-row">
                        <h2>{shopName || roleLabel}</h2>
                        <span className="vendor-profile-role-pill">{roleLabel}</span>
                    </div>
                    <p className="vendor-profile-bio">Passionate about electronics and innovation. Love exploring new products and finding great deals.</p>
                </div>
            </div>
        </section>
    );
};

export default VendorProfileHeroCard;
