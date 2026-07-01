const CART_STORAGE_KEY = 'marketplace_cart_v1';

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const readCartState = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!rawValue) {
    return {};
  }

  const parsed = safeParse(rawValue);
  return parsed && typeof parsed === 'object' ? parsed : {};
};

const emitCartUpdatedEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event('cart-updated'));
};

const writeCartState = (nextState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextState));
  emitCartUpdatedEvent();
};

const normalizeUserId = (userId) => String(userId || 'guest').trim() || 'guest';

const normalizeCartItems = (items = []) => {
  return items
    .map((item) => ({
      productId: String(item?.productId || '').trim(),
      quantity: Math.max(1, Number(item?.quantity || 1)),
      addedAt: Number(item?.addedAt || Date.now()),
    }))
    .filter((item) => Boolean(item.productId));
};

export const getCartItems = (userId) => {
  const state = readCartState();
  const userKey = normalizeUserId(userId);
  return normalizeCartItems(state[userKey] || []);
};

export const getCartCount = (userId) => {
  return getCartItems(userId).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
};

export const addToCartItem = (userId, productId, quantity = 1) => {
  const normalizedProductId = String(productId || '').trim();
  if (!normalizedProductId) {
    return [];
  }

  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const userKey = normalizeUserId(userId);
  const state = readCartState();
  const items = normalizeCartItems(state[userKey] || []);

  const existingIndex = items.findIndex((item) => item.productId === normalizedProductId);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + normalizedQuantity,
    };
  } else {
    items.push({
      productId: normalizedProductId,
      quantity: normalizedQuantity,
      addedAt: Date.now(),
    });
  }

  state[userKey] = items;
  writeCartState(state);
  return items;
};

export const setCartItemQuantity = (userId, productId, quantity) => {
  const userKey = normalizeUserId(userId);
  const state = readCartState();
  const items = normalizeCartItems(state[userKey] || []);
  const nextQuantity = Math.floor(Number(quantity || 0));

  if (nextQuantity <= 0) {
    state[userKey] = items.filter((item) => item.productId !== productId);
    writeCartState(state);
    return state[userKey];
  }

  state[userKey] = items.map((item) => (
    item.productId === productId
      ? { ...item, quantity: nextQuantity }
      : item
  ));

  writeCartState(state);
  return state[userKey];
};

export const removeCartItem = (userId, productId) => {
  const userKey = normalizeUserId(userId);
  const state = readCartState();
  const items = normalizeCartItems(state[userKey] || []);
  state[userKey] = items.filter((item) => item.productId !== productId);
  writeCartState(state);
  return state[userKey];
};

export const clearCart = (userId) => {
  const userKey = normalizeUserId(userId);
  const state = readCartState();
  state[userKey] = [];
  writeCartState(state);
};
