import styled from 'styled-components';
import { ShoppingCart, Bell, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Query } from 'appwrite';
import { databases, realtime } from '../../lib/appwrite.js';
import { useAuth } from '../../lib/auth-context.js';
import { addToCartItem } from '../../lib/cart.js';

const HeaderWrapper = styled.header`
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

const LogoCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 18px;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
`;

const LogoText = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavSection = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
  margin-left: 48px;

  @media (max-width: 1024px) {
    gap: 24px;
    margin-left: 32px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: #3b82f6;
  }

  &.active {
    color: #3b82f6;
  }
`;

const LogoutButton = styled.button`
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const ProfileLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  border-radius: 10px;
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f3f4f6;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const UserEmail = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
`;

const UserRole = styled.span`
  font-size: 10px;
  color: #9ca3af;
  font-weight: 400;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
  border-radius: 6px;
  position: relative;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
`;

const NotificationDot = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
`;

const NotificationWrap = styled.div`
  position: relative;
`;

const NotificationCount = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  border: 1px solid #ffffff;
  font-size: 10px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const NotificationPanel = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: min(92vw, 390px);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  z-index: 130;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
`;

const NotificationTitle = styled.div`
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
`;

const NotificationMeta = styled.div`
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
`;

const NotificationList = styled.div`
  max-height: 380px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationItemTitle = styled.div`
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
`;

const NotificationItemMessage = styled.div`
  margin-top: 5px;
  color: #475569;
  font-size: 13px;
  line-height: 1.35;
`;

const NotificationItemFooter = styled.div`
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const NotificationItemTime = styled.div`
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
`;

const NotificationActionButton = styled.button`
  border: none;
  background: #4f46e5;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;

  &:hover {
    background: #4338ca;
  }
`;

const EmptyNotifications = styled.div`
  padding: 18px 14px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
`;

const DATABASE_ID = '69c1cfaf003a710f1232';
const AUCTIONS_COLLECTION_ID = 'auctions';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';

const chunkArray = (list, size) => {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

const toString = (value, fallback = '') => String(value ?? fallback).trim();

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
  const documents = [];
  let cursor = null;

  while (true) {
    const queries = [...baseQueries, Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const batch = response?.documents || [];

    if (!batch.length) {
      break;
    }

    documents.push(...batch);

    if (batch.length < 100) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return documents;
};

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const MobileMenu = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 16px;
    flex-direction: column;
    gap: 12px;
  }
`;

const MobileNavLink = styled.a`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s ease;

  &:hover {
    color: #3b82f6;
  }

  &.active {
    color: #3b82f6;
  }
`;

const MobileLogoutButton = styled.button`
  margin-top: 8px;
  width: 100%;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const HeaderComponent = ({
  userEmail = 'Account',
  cartCount = 0,
  onLogout,
  profilePath = '/settings',
  cartPath = '/cart',
  notifications = null,
  onNotificationAction,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [internalNotifications, setInternalNotifications] = useState([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(new Set());
  const notificationRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const effectiveNotifications = Array.isArray(notifications) ? notifications : internalNotifications;
  const notificationCount = effectiveNotifications.length;

  useEffect(() => {
    if (Array.isArray(notifications)) {
      return undefined;
    }

    const userId = toString(user?.$id || localStorage.getItem('userId') || '');

    if (!userId) {
      setInternalNotifications([]);
      return undefined;
    }

    const loadNotifications = async () => {
      try {
        const nowIso = new Date().toISOString();
        const wonAuctionDocs = await fetchAllDocuments(AUCTIONS_COLLECTION_ID, [
          Query.equal('highest_bidder_id', [userId]),
          Query.lessThan('end_time', nowIso),
          Query.orderDesc('end_time'),
        ]);

        if (!wonAuctionDocs.length) {
          setInternalNotifications([]);
          return;
        }

        const productIds = [...new Set(wonAuctionDocs.map((doc) => toString(doc?.product_id)).filter(Boolean))];
        const products = [];

        for (const idsChunk of chunkArray(productIds, 100)) {
          const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
            Query.equal('$id', idsChunk),
            Query.limit(100),
          ]);
          products.push(...(response?.documents || []));
        }

        const productMap = products.reduce((acc, doc) => {
          acc[doc.$id] = doc;
          return acc;
        }, {});

        const existingOrderKeys = new Set();

        for (const idsChunk of chunkArray(productIds, 100)) {
          const orderResponse = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
            Query.equal('customerId', [userId]),
            Query.equal('productId', idsChunk),
            Query.limit(200),
          ]);

          for (const orderDoc of orderResponse?.documents || []) {
            const key = `${toString(orderDoc?.productId)}::${toString(orderDoc?.status).toLowerCase()}`;
            existingOrderKeys.add(key);
          }
        }

        const nextNotifications = wonAuctionDocs
          .filter((auctionDoc) => {
            const productId = toString(auctionDoc?.product_id);
            if (!productId) {
              return false;
            }

            const alreadyHandled =
              existingOrderKeys.has(`${productId}::pending`) ||
              existingOrderKeys.has(`${productId}::processing`) ||
              existingOrderKeys.has(`${productId}::completed`) ||
              existingOrderKeys.has(`${productId}::delivered`);

            return !alreadyHandled;
          })
          .map((auctionDoc) => {
            const productId = toString(auctionDoc?.product_id);
            const product = productMap[productId];
            const title = toString(product?.name || auctionDoc?.title || 'Auction item');
            const endedAt = new Date(auctionDoc?.end_time);

            return {
              id: `auction-win:${auctionDoc.$id}`,
              type: 'auction-win',
              title: 'Auction Won',
              message: `You won the bid for ${title}. Complete checkout to confirm your order.`,
              timeLabel: Number.isNaN(endedAt.getTime()) ? '' : `Ended ${endedAt.toLocaleString()}`,
              actionLabel: 'Checkout',
              productId,
            };
          })
          .filter((entry) => !dismissedNotificationIds.has(entry.id));

        setInternalNotifications(nextNotifications);
      } catch (notificationError) {
        console.error('Failed to load header notifications:', notificationError);
      }
    };

    loadNotifications();

    const pollTimer = setInterval(loadNotifications, 8000);
    const channel = `databases.${DATABASE_ID}.collections.${AUCTIONS_COLLECTION_ID}.documents`;

    const scheduleRealtimeRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        loadNotifications();
      }, 250);
    };

    const subscription = realtime.subscribe(channel, scheduleRealtimeRefresh);

    return () => {
      clearInterval(pollTimer);

      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user?.$id, notifications, dismissedNotificationIds]);

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    const handleDocumentClick = (event) => {
      if (!notificationRef.current) {
        return;
      }

      if (!notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [notificationsOpen]);

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <HeaderWrapper>
      <HeaderContainer>
        {/* Logo */}
        <LogoSection onClick={handleLogoClick}>
          <LogoCircle>M</LogoCircle>
          <LogoText>Marketplace</LogoText>
        </LogoSection>

        {/* Navigation - Desktop */}
        <NavSection>
          <NavLink as={Link} to="/store-home">Dashboard</NavLink>
          <NavLink as={Link} to="/store-home">Categories</NavLink>
          <NavLink as={Link} to="/auctions">Auctions</NavLink>
          <NavLink as={Link} to="/orders">Orders</NavLink>
        </NavSection>

        {/* Profile Section */}
        <ProfileSection>
          <LogoutButton type="button" onClick={onLogout}>Logout</LogoutButton>

          {/* Cart Icon */}
          <IconButton as={Link} to={cartPath} title="Shopping Cart" aria-label="Open cart">
            <ShoppingCart />
            <CartBadge>{cartCount}</CartBadge>
          </IconButton>

          {/* Notification Icon */}
          <NotificationWrap ref={notificationRef}>
            <IconButton
              title="Notifications"
              aria-label="Open notifications"
              onClick={() => setNotificationsOpen((prev) => !prev)}
            >
              <Bell />
              {notificationCount > 0 ? <NotificationCount>{Math.min(notificationCount, 99)}</NotificationCount> : null}
              {notificationCount > 0 ? <NotificationDot /> : null}
            </IconButton>

            {notificationsOpen && (
              <NotificationPanel>
                <NotificationHeader>
                  <NotificationTitle>Notifications</NotificationTitle>
                  <NotificationMeta>{notificationCount} item(s)</NotificationMeta>
                </NotificationHeader>

                <NotificationList>
                  {notificationCount ? effectiveNotifications.map((notification) => (
                    <NotificationItem key={notification.id}>
                      <NotificationItemTitle>{notification.title || 'Notification'}</NotificationItemTitle>
                      <NotificationItemMessage>
                        {notification.message || ''}
                      </NotificationItemMessage>

                      <NotificationItemFooter>
                        <NotificationItemTime>
                          {notification.timeLabel || ''}
                        </NotificationItemTime>

                        {notification.actionLabel ? (
                          <NotificationActionButton
                            type="button"
                            onClick={() => {
                              if (onNotificationAction) {
                                onNotificationAction(notification);
                              } else {
                                const productId = toString(notification?.productId);
                                const userId = toString(user?.$id || localStorage.getItem('userId') || '');

                                if (productId && userId) {
                                  addToCartItem(userId, productId, 1);
                                  navigate('/checkout');

                                  setDismissedNotificationIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(notification.id);
                                    return next;
                                  });

                                  setInternalNotifications((current) => current.filter((entry) => entry.id !== notification.id));
                                }
                              }
                              setNotificationsOpen(false);
                            }}
                          >
                            {notification.actionLabel}
                          </NotificationActionButton>
                        ) : null}
                      </NotificationItemFooter>
                    </NotificationItem>
                  )) : (
                    <EmptyNotifications>No notifications yet.</EmptyNotifications>
                  )}
                </NotificationList>
              </NotificationPanel>
            )}
          </NotificationWrap>

          {/* User Profile */}
          <ProfileLink to={profilePath} title="Open profile">
            <UserProfile>
              <AvatarPlaceholder title={userEmail}>
                {userEmail.charAt(0).toUpperCase()}
              </AvatarPlaceholder>
              <UserInfo>
                <UserEmail>{userEmail}</UserEmail>
                <UserRole>Customer</UserRole>
              </UserInfo>
            </UserProfile>
          </ProfileLink>

          {/* Mobile Menu Button */}
          <MobileMenuButton 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </MobileMenuButton>
        </ProfileSection>
      </HeaderContainer>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <MobileMenu>
          <MobileNavLink as={Link} to="/store-home">Dashboard</MobileNavLink>
          <MobileNavLink as={Link} to="/store-home">Categories</MobileNavLink>
          <MobileNavLink as={Link} to="/auctions">Auctions</MobileNavLink>
          <MobileNavLink as={Link} to="/orders">Orders</MobileNavLink>
          <MobileLogoutButton type="button" onClick={onLogout}>Logout</MobileLogoutButton>
        </MobileMenu>
      )}
    </HeaderWrapper>
  );
};

export default HeaderComponent;
