import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ID, Query } from 'appwrite';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import CheckoutStepper from '../components/checkoutcomponent/CheckoutStepper.jsx';
import ShippingForm from '../components/checkoutcomponent/ShippingForm.jsx';
import PaymentForm from '../components/checkoutcomponent/PaymentForm.jsx';
import OrderSummary from '../components/checkoutcomponent/OrderSummary.jsx';
import SavedAddressPrompt from '../components/checkoutcomponent/SavedAddressPrompt.jsx';
import { useAuth } from '../lib/auth-context.js';
import { logout, databases } from '../lib/appwrite.js';
import { clearCart, getCartCount, getCartItems } from '../lib/cart.js';
import '../styling/checkout/CheckoutPage.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const ORDERS_COLLECTION_ID = 'orders';
const SHIPPING_INFO_COLLECTION_ID = 'shipping_info';

const SHIPPING_COST = 15;
const TAX_RATE = 0.1;

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  apartment: '',
  city: '',
  state: '',
  zipCode: ''
};

const chunk = (items = [], size = 100) => {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const createCheckoutOrderId = () => String(ID.unique()).slice(0, 36);

const asAddressFromShippingDoc = (doc) => ({
  firstName: String(doc?.firstName || ''),
  lastName: String(doc?.lastName || ''),
  email: String(doc?.email || ''),
  phone: String(doc?.phone || ''),
  streetAddress: String(doc?.streetAddress || ''),
  apartment: String(doc?.apartment || ''),
  city: String(doc?.city || ''),
  state: String(doc?.state || ''),
  zipCode: String(doc?.zipCode || '')
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { orderId = '' } = useParams();
  const { user, role, setUser, setRole } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [saveForNextOrder, setSaveForNextOrder] = useState(false);
  const [activeStep, setActiveStep] = useState('shipping');
  const [showSavedAddressPrompt, setShowSavedAddressPrompt] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [currentUserDoc, setCurrentUserDoc] = useState(null);
  const [checkoutOrderId, setCheckoutOrderId] = useState(() => String(orderId || '').slice(0, 36));
  const [pendingOrderDocs, setPendingOrderDocs] = useState([]);
  const [paymentData, setPaymentData] = useState({
    method: 'card',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    billingSameAsShipping: true
  });
  const [cartItems, setCartItems] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [vendorMap, setVendorMap] = useState({});
  const [resolvedVendorIdMap, setResolvedVendorIdMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const userId = user?.$id || '';
  const profilePath = role === 'Vendor' ? '/vendor-profile' : '/profile';

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((current) => ({
      ...current,
      email: current.email || String(user?.email || '').trim()
    }));
  }, [user]);

  useEffect(() => {
    const loadSavedAddressPreference = async () => {
      if (!user?.$id) {
        setSavedAddress(null);
        setShowSavedAddressPrompt(false);
        return;
      }

      try {
        let userDoc = null;

        try {
          userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id);
        } catch {
          const userEmail = String(user?.email || '').trim().toLowerCase();
          if (!userEmail) {
            userDoc = null;
          } else {
            const lookup = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
              Query.equal('email', [userEmail]),
              Query.limit(1)
            ]);

            userDoc = lookup?.documents?.[0] || null;
          }
        }

        setCurrentUserDoc(userDoc);

        const customerIdFromUser = String(userDoc?.$id || user?.$id || '').trim();
        if (!customerIdFromUser) {
          setSavedAddress(null);
          setShowSavedAddressPrompt(false);
          return;
        }

        let latestSavedShipping = null;

        try {
          const byUserId = await databases.listDocuments(DATABASE_ID, SHIPPING_INFO_COLLECTION_ID, [
            Query.equal('userId', [customerIdFromUser]),
            Query.equal('useInfoForNextOrder', [true]),
            Query.orderDesc('$createdAt'),
            Query.limit(1)
          ]);

          latestSavedShipping = byUserId?.documents?.[0] || null;
        } catch {
          latestSavedShipping = null;
        }

        if (latestSavedShipping) {
          setSavedAddress(asAddressFromShippingDoc(latestSavedShipping));
          setShowSavedAddressPrompt(true);
          return;
        }

        const canUseSaved = Boolean(userDoc?.useInfoForNextOrder);
        if (!canUseSaved) {
          setSavedAddress(null);
          setShowSavedAddressPrompt(false);
          return;
        }

        const rawSavedAddress = String(userDoc?.savedAddress || '').trim();
        if (!rawSavedAddress) {
          setSavedAddress(null);
          setShowSavedAddressPrompt(false);
          return;
        }

        let parsedAddress = null;
        try {
          parsedAddress = JSON.parse(rawSavedAddress);
        } catch {
          parsedAddress = null;
        }

        if (!parsedAddress || typeof parsedAddress !== 'object') {
          setSavedAddress(null);
          setShowSavedAddressPrompt(false);
          return;
        }

        setSavedAddress(parsedAddress);
        setShowSavedAddressPrompt(true);
      } catch {
        setSavedAddress(null);
        setShowSavedAddressPrompt(false);
      }
    };

    loadSavedAddressPreference();
  }, [user?.$id, user?.email]);

  useEffect(() => {
    setCartItems(getCartItems(userId));
  }, [userId]);

  useEffect(() => {
    const refresh = () => setCartItems(getCartItems(userId));

    window.addEventListener('cart-updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('cart-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [userId]);

  useEffect(() => {
    const loadCartProducts = async () => {
      if (!cartItems.length) {
        setProductMap({});
        setVendorMap({});
        setResolvedVendorIdMap({});
        return;
      }

      const productIds = [...new Set(cartItems.map((item) => item.productId).filter(Boolean))];
      const allProducts = [];

      for (const idChunk of chunk(productIds, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
          Query.equal('$id', idChunk),
          Query.limit(100)
        ]);

        allProducts.push(...(response?.documents || []));
      }

      const nextProductMap = allProducts.reduce((acc, doc) => {
        acc[doc.$id] = doc;
        return acc;
      }, {});

      setProductMap(nextProductMap);

      const vendorRefs = [...new Set(allProducts.map((item) => String(item.vendorId || item.vendor_id || '').trim()).filter(Boolean))];
      if (!vendorRefs.length) {
        setVendorMap({});
        setResolvedVendorIdMap({});
        return;
      }

      const directUserDocs = [];
      for (const vendorChunk of chunk(vendorRefs, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
          Query.equal('$id', vendorChunk),
          Query.limit(100)
        ]);

        directUserDocs.push(...(response?.documents || []));
      }

      const vendorsByDocId = {};
      for (const vendorChunk of chunk(vendorRefs, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
          Query.equal('$id', vendorChunk),
          Query.limit(100)
        ]);

        for (const vendorDoc of response?.documents || []) {
          vendorsByDocId[vendorDoc.$id] = vendorDoc;
        }
      }

      const vendorsByVendorId = {};
      for (const vendorChunk of chunk(vendorRefs, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
          Query.equal('vendorId', vendorChunk),
          Query.limit(100)
        ]);

        for (const vendorDoc of response?.documents || []) {
          const key = String(vendorDoc.vendorId || '').trim();
          if (key) {
            vendorsByVendorId[key] = vendorDoc;
          }
        }
      }

      const directUsersById = directUserDocs.reduce((acc, doc) => {
        acc[doc.$id] = doc;
        return acc;
      }, {});

      const nextResolvedVendorIdMap = {};
      const candidateVendorUserIds = new Set(Object.keys(directUsersById));

      for (const vendorRef of vendorRefs) {
        const vendorDocFromId = vendorsByDocId[vendorRef];
        const vendorDocFromVendorId = vendorsByVendorId[vendorRef];

        const resolvedVendorUserId = String(
          directUsersById[vendorRef]?.$id
            || vendorDocFromId?.vendorId
            || vendorDocFromVendorId?.vendorId
            || vendorRef
        ).trim();

        if (resolvedVendorUserId) {
          nextResolvedVendorIdMap[vendorRef] = resolvedVendorUserId;
          candidateVendorUserIds.add(resolvedVendorUserId);
        }
      }

      const allVendorUserIds = [...candidateVendorUserIds].filter(Boolean);
      const allVendorUserDocs = [...directUserDocs];

      const missingVendorUserIds = allVendorUserIds.filter((id) => !directUsersById[id]);
      for (const vendorChunk of chunk(missingVendorUserIds, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
          Query.equal('$id', vendorChunk),
          Query.limit(100)
        ]);

        allVendorUserDocs.push(...(response?.documents || []));
      }

      const nextVendorMap = allVendorUserDocs.reduce((acc, doc) => {
        acc[doc.$id] = doc;
        return acc;
      }, {});

      setVendorMap(nextVendorMap);
      setResolvedVendorIdMap(nextResolvedVendorIdMap);
    };

    loadCartProducts().catch((error) => {
      console.error('Failed to load checkout cart products:', error);
      setProductMap({});
      setVendorMap({});
    });
  }, [cartItems]);

  const summaryItems = useMemo(() => {
    return cartItems
      .map((entry) => {
        const product = productMap[entry.productId];
        if (!product) {
          return null;
        }

        const vendorRef = String(product.vendorId || product.vendor_id || '').trim();
        const vendorId = String(resolvedVendorIdMap[vendorRef] || vendorRef).trim();
        const vendorDoc = vendorMap[vendorId];

        const quantity = Math.max(1, Number(entry.quantity || 1));
        const price = Number(product.price || 0);

        return {
          productId: product.$id,
          name: String(product.name || 'Product'),
          imageUrl: String(product.imageUrl || product.image_url || ''),
          vendorId: vendorDoc?.$id ? vendorId : '',
          vendorName: String(vendorDoc?.name || 'Vendor'),
          quantity,
          lineTotal: quantity * price
        };
      })
      .filter(Boolean);
  }, [cartItems, productMap, vendorMap, resolvedVendorIdMap]);

  const subtotal = useMemo(() => summaryItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0), [summaryItems]);
  const shipping = SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const customerId = String(currentUserDoc?.$id || user?.$id || '').trim();

  const ensureCheckoutOrderId = () => {
    const currentOrderId = String(checkoutOrderId || '').trim().slice(0, 36);

    if (currentOrderId) {
      return currentOrderId;
    }

    const nextOrderId = createCheckoutOrderId();
    setCheckoutOrderId(nextOrderId);
    return nextOrderId;
  };

  const persistSavedAddressPreference = async (addressValues, enabled) => {
    if (!enabled || !user?.$id) {
      return false;
    }

    const savedAddressValue = JSON.stringify({
      firstName: String(addressValues.firstName || ''),
      lastName: String(addressValues.lastName || ''),
      email: String(addressValues.email || ''),
      phone: String(addressValues.phone || ''),
      streetAddress: String(addressValues.streetAddress || ''),
      apartment: String(addressValues.apartment || ''),
      city: String(addressValues.city || ''),
      state: String(addressValues.state || ''),
      zipCode: String(addressValues.zipCode || '')
    });

    const userUpdatePayload = {
      savedAddress: savedAddressValue,
      useInfoForNextOrder: true
    };

    try {
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, user.$id, userUpdatePayload);
      return true;
    } catch (directUpdateError) {
      const userEmail = String(user.email || '').trim().toLowerCase();

      if (!userEmail) {
        console.warn('Skipping saved-address persistence: unable to update users row.', directUpdateError);
        return false;
      }

      try {
        const fallbackLookup = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
          Query.equal('email', [userEmail]),
          Query.limit(1)
        ]);

        const targetUserDoc = fallbackLookup?.documents?.[0];
        if (!targetUserDoc?.$id) {
          console.warn('Skipping saved-address persistence: fallback users row not found.');
          return false;
        }

        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, targetUserDoc.$id, userUpdatePayload);
        return true;
      } catch (fallbackError) {
        console.warn('Skipping saved-address persistence: fallback users update failed.', fallbackError);
        return false;
      }
    }
  };

  const resolveReusableOrNewOrderId = async () => {
    const productIds = [...new Set(summaryItems.map((item) => String(item.productId || '').trim()).filter(Boolean))];

    if (customerId && productIds.length) {
      const pendingMatches = [];

      for (const productChunk of chunk(productIds, 100)) {
        const response = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
          Query.equal('customerId', [customerId]),
          Query.equal('status', ['pending']),
          Query.equal('productId', productChunk),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]);

        pendingMatches.push(...(response?.documents || []));
      }

      const reusable = pendingMatches.find((doc) => String(doc?.orderId || '').trim());
      if (reusable?.orderId) {
        const reusedOrderId = String(reusable.orderId).trim().slice(0, 36);
        setCheckoutOrderId(reusedOrderId);
        return reusedOrderId;
      }
    }

    return ensureCheckoutOrderId();
  };

  const createShippingAndPendingOrders = async (addressValues, options = {}) => {
    const savePreference = Object.prototype.hasOwnProperty.call(options, 'saveForNextOrder')
      ? Boolean(options.saveForNextOrder)
      : Boolean(saveForNextOrder);
    const useSavedInfo = Boolean(options.useSavedInfo);
    const currentOrderId = await resolveReusableOrNewOrderId();

    if (!user?.$id) {
      navigate('/login');
      return false;
    }

    if (!summaryItems.length) {
      setErrorMessage('Your cart is empty. Add items before checkout.');
      return false;
    }

    if (!customerId) {
      setErrorMessage('Unable to resolve customer id from users table. Please sign in again.');
      return false;
    }

    if (!pendingOrderDocs.length) {
      const existingOrders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
        Query.equal('orderId', [currentOrderId]),
        Query.equal('customerId', [customerId]),
        Query.limit(200)
      ]);

      const existingOrderDocs = existingOrders?.documents || [];
      const existingOrderByItem = new Map(
        existingOrderDocs.map((doc) => [`${String(doc.productId || '').trim()}::${String(doc.vendorId || '').trim()}`, doc])
      );

      if (!useSavedInfo) {
        const existingShippingRows = await databases.listDocuments(DATABASE_ID, SHIPPING_INFO_COLLECTION_ID, [
          Query.equal('orderId', [currentOrderId]),
          Query.equal('userId', [customerId]),
          Query.limit(1)
        ]);

        if (!(existingShippingRows?.documents || []).length) {
          const shippingPayload = {
            userId: customerId,
            customerId,
            orderId: currentOrderId,
            firstName: addressValues.firstName,
            lastName: addressValues.lastName,
            email: addressValues.email,
            phone: addressValues.phone,
            streetAddress: addressValues.streetAddress,
            apartment: addressValues.apartment,
            city: addressValues.city,
            state: addressValues.state,
            zipCode: addressValues.zipCode,
            useInfoForNextOrder: savePreference
          };

          await databases.createDocument(
            DATABASE_ID,
            SHIPPING_INFO_COLLECTION_ID,
            ID.unique(),
            shippingPayload
          );
        }
      }

      const createdOrders = [];
      const allOrderDocs = [...existingOrderDocs];

      for (const item of summaryItems) {
        const productId = String(item.productId || '').trim();
        const vendorId = String(item.vendorId || '').trim().slice(0, 36);
        if (!vendorId) {
          continue;
        }

        const itemKey = `${productId}::${vendorId}`;

        if (existingOrderByItem.has(itemKey)) {
          continue;
        }

        const payload = {
          orderId: currentOrderId,
          customerId,
          vendorId,
          productId,
          quantity: Math.max(1, Number(item.quantity || 1)),
          totalAmount: Number(item.lineTotal || 0),
          status: 'pending'
        };

        const orderDoc = await databases.createDocument(
          DATABASE_ID,
          ORDERS_COLLECTION_ID,
          ID.unique(),
          payload
        );

        createdOrders.push(orderDoc);
        allOrderDocs.push(orderDoc);
      }

      if (!allOrderDocs.length) {
        setErrorMessage('Unable to resolve vendor id from users/vendors table for cart items.');
        return false;
      }

      await persistSavedAddressPreference(addressValues, savePreference);

      setPendingOrderDocs(allOrderDocs);
    }

    return true;
  };

  const handleShippingSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const created = await createShippingAndPendingOrders(formData);
      if (!created) {
        return;
      }

      setActiveStep('payment');
    } catch (error) {
      console.error('Failed to prepare checkout records:', error);
      setErrorMessage(error?.message || 'Unable to prepare checkout right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault();

    if (!user?.$id) {
      navigate('/login');
      return;
    }

    if (!summaryItems.length) {
      setErrorMessage('Your cart is empty. Add items before checkout.');
      return;
    }

    if (paymentData.method === 'card') {
      if (!paymentData.cardNumber || !paymentData.cardholderName || !paymentData.expiryDate || !paymentData.cvv) {
        setErrorMessage('Please complete all required card fields.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const prepared = await createShippingAndPendingOrders(formData);
      if (!prepared) {
        return;
      }

      const ordersToProcess = pendingOrderDocs.length
        ? pendingOrderDocs
        : await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
            Query.equal('orderId', [ensureCheckoutOrderId()]),
            Query.equal('customerId', [customerId]),
            Query.limit(200)
          ]).then((response) => response?.documents || []);

      for (const orderDoc of ordersToProcess) {
        const updatePayload = {
          orderId: String(orderDoc.orderId || ensureCheckoutOrderId()),
          customerId: String(orderDoc.customerId || customerId),
          vendorId: String(orderDoc.vendorId || '').trim().slice(0, 36),
          productId: String(orderDoc.productId || ''),
          quantity: Math.max(1, Number(orderDoc.quantity || 1)),
          totalAmount: Number(orderDoc.totalAmount || 0),
          status: 'processing'
        };

        await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, orderDoc.$id, updatePayload);
      }

      clearCart(userId);
      setCartItems([]);

      setSuccessMessage('Order placed successfully.');
      navigate('/checkout/review', {
        state: {
          orderId: ensureCheckoutOrderId(),
          items: summaryItems,
          subtotal,
          shipping,
          tax,
          total,
          shippingAddress: formData,
          paymentMethod: paymentData.method
        }
      });
    } catch (error) {
      console.error('Checkout submit failed:', error);
      const isPermissionError = String(error?.message || '').toLowerCase().includes('not authorized');
      if (isPermissionError) {
        setErrorMessage('You are not authorized to update this order record. Please go back to shipping and continue to payment again.');
      } else {
        setErrorMessage(error?.message || 'Unable to save shipping information right now.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <div className="checkout-page">
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={profilePath}
        cartPath="/cart"
        cartCount={getCartCount(userId)}
        onLogout={handleLogout}
      />

      <main className="checkout-page-main">
        <button type="button" className="checkout-back" onClick={() => navigate('/cart')}>
          ← Back to Cart
        </button>

        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-subtitle">Complete your purchase securely</p>

        <CheckoutStepper activeStep={activeStep} />

        {successMessage ? <p className="checkout-message checkout-message--success">{successMessage}</p> : null}
        {errorMessage ? <p className="checkout-message checkout-message--error">{errorMessage}</p> : null}

        <section className="checkout-grid">
          {activeStep === 'shipping' ? (
            showSavedAddressPrompt && savedAddress ? (
              <SavedAddressPrompt
                address={savedAddress}
                onUseSaved={async () => {
                  setFormData((current) => ({
                    ...current,
                    firstName: String(savedAddress.firstName || ''),
                    lastName: String(savedAddress.lastName || ''),
                    email: String(savedAddress.email || current.email || ''),
                    phone: String(savedAddress.phone || ''),
                    streetAddress: String(savedAddress.streetAddress || ''),
                    apartment: String(savedAddress.apartment || ''),
                    city: String(savedAddress.city || ''),
                    state: String(savedAddress.state || ''),
                    zipCode: String(savedAddress.zipCode || '')
                  }));
                  const nextFormValues = {
                    firstName: String(savedAddress.firstName || ''),
                    lastName: String(savedAddress.lastName || ''),
                    email: String(savedAddress.email || formData.email || ''),
                    phone: String(savedAddress.phone || ''),
                    streetAddress: String(savedAddress.streetAddress || ''),
                    apartment: String(savedAddress.apartment || ''),
                    city: String(savedAddress.city || ''),
                    state: String(savedAddress.state || ''),
                    zipCode: String(savedAddress.zipCode || '')
                  };

                  setSubmitting(true);
                  setErrorMessage('');
                  setSuccessMessage('');

                  try {
                    setSaveForNextOrder(true);
                    setCheckoutOrderId('');
                    setPendingOrderDocs([]);
                    const created = await createShippingAndPendingOrders(nextFormValues, {
                      saveForNextOrder: true,
                      useSavedInfo: true
                    });
                    if (!created) {
                      return;
                    }

                    setShowSavedAddressPrompt(false);
                    setActiveStep('payment');
                  } catch (error) {
                    console.error('Failed to use saved address:', error);
                    setErrorMessage(error?.message || 'Unable to continue with saved address.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                onEnterNew={() => {
                  setShowSavedAddressPrompt(false);
                }}
              />
            ) : (
              <ShippingForm
                values={formData}
                onChange={handleChange}
                onSubmit={handleShippingSubmit}
                submitting={submitting}
                saveForNextOrder={saveForNextOrder}
                onToggleSave={() => setSaveForNextOrder((value) => !value)}
              />
            )
          ) : (
            <PaymentForm
              values={paymentData}
              onChange={(event) => {
                const { name, value } = event.target;
                setPaymentData((current) => ({ ...current, [name]: value }));
              }}
              onMethodChange={(method) => {
                setPaymentData((current) => ({ ...current, method }));
              }}
              onToggleBillingSameAsShipping={() => {
                setPaymentData((current) => ({
                  ...current,
                  billingSameAsShipping: !current.billingSameAsShipping
                }));
              }}
              onBack={() => {
                setActiveStep('shipping');
                setErrorMessage('');
              }}
              onSubmit={handleCheckoutSubmit}
              submitting={submitting}
            />
          )}

          <OrderSummary
            items={summaryItems}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
          />
        </section>
      </main>
    </div>
  );
};

export default CheckoutPage;
