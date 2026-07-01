import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Query } from 'appwrite';
import { databases } from '../../lib/appwrite.js';
import { useAuth } from '../../lib/auth-context.js';
import { addToCartItem } from '../../lib/cart.js';
import { CATEGORY_ALIASES, normalizeCategoryValue } from '../homepage-component/storeHomeData.js';
import ProductCard from './ProductCard';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const REVIEWS_COLLECTION_ID = 'reviews';
const FALLBACK_PRODUCT_IMAGE = 'https://via.placeholder.com/900x700?text=No+Image';

const SectionWrap = styled.section``;

const SectionTitle = styled.h2`
  margin: 2px 0 14px;
  color: #0f172a;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.01em;

  span {
    color: #64748b;
    font-size: 18px;
    font-weight: 500;
    margin-left: 6px;
  }
`;

const ProductGridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1150px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  padding: 28px;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
`;

const normalize = (value) => normalizeCategoryValue(value);

const normalizeSearchText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

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

const computeAverageRating = (reviewList = []) => {
  if (!reviewList.length) {
    return 0;
  }

  const total = reviewList.reduce((sum, review) => sum + Number(review?.rating || 0), 0);
  return total / reviewList.length;
};

const resolveCategoryAliases = (resolvedCategory) => {
  const aliasKey = Object.keys(CATEGORY_ALIASES).find(
    (key) => normalize(key) === resolvedCategory
  );

  const aliases = aliasKey ? CATEGORY_ALIASES[aliasKey] : [];
  return new Set([resolvedCategory, ...aliases.map((alias) => normalize(alias))]);
};

const isRetailListType = (listTypeValue) => {
  const normalized = String(listTypeValue || '').trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return normalized !== 'auction';
};

const mapProductsWithReviewStats = (productDocs, reviewDocs) => {
  const reviewsByProductId = reviewDocs.reduce((acc, review) => {
    const productId = String(review?.productId || '').trim();
    if (!productId) {
      return acc;
    }

    if (!acc[productId]) {
      acc[productId] = [];
    }

    acc[productId].push(review);
    return acc;
  }, {});

  return productDocs.map((doc) => {
    const reviewList = reviewsByProductId[doc.$id] || [];

    return {
      id: doc.$id,
      name: String(doc?.name || 'Untitled Product'),
      price: Number(doc?.price || 0),
      image_url: String(doc?.imageUrl || doc?.image_url || FALLBACK_PRODUCT_IMAGE),
      category: String(doc?.category || 'Category'),
      stock: Number(doc?.stock || 0),
      total_reviews: reviewList.length,
      average_rating: computeAverageRating(reviewList),
    };
  });
};

const ProductGrid = ({ categoryName, searchQuery = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingProductId, setBuyingProductId] = useState('');

  useEffect(() => {
    const loadCategoryProducts = async () => {
      setLoading(true);

      try {
        const resolvedCategory = normalize(decodeURIComponent(categoryName || ''));
        const categoryAliasSet = resolveCategoryAliases(resolvedCategory);

        const allProducts = await fetchAllDocuments(PRODUCTS_COLLECTION_ID);
        const filteredProducts = allProducts.filter((doc) =>
          categoryAliasSet.has(normalize(doc?.category))
          && isRetailListType(doc?.list_type)
        );

        if (!filteredProducts.length) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const allReviews = await fetchAllDocuments(REVIEWS_COLLECTION_ID).catch(() => []);
        const productIds = new Set(filteredProducts.map((doc) => doc.$id));
        const relatedReviews = allReviews.filter((review) => productIds.has(String(review?.productId || '').trim()));

        setProducts(mapProductsWithReviewStats(filteredProducts, relatedReviews));
      } catch (error) {
        console.error('Error loading category products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryProducts();
  }, [categoryName]);

  const titleCategory = useMemo(() => {
    const raw = decodeURIComponent(categoryName || '').trim();
    if (!raw) {
      return 'Category';
    }

    return raw
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }, [categoryName]);

  const filteredProducts = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchable = [product?.name, product?.category]
        .map((value) => normalizeSearchText(value))
        .join(' ');

      return searchable.includes(query);
    });
  }, [products, searchQuery]);

  const handleBuy = async (product) => {
    const productId = String(product?.id || '').trim();
    if (!productId) {
      return;
    }

    const userId = user?.$id;
    if (!userId) {
      navigate('/login');
      return;
    }

    setBuyingProductId(productId);

    try {
      addToCartItem(userId, productId, 1);
      navigate('/cart');
    } finally {
      setBuyingProductId('');
    }
  };

  return (
    <SectionWrap>
      <SectionTitle>
        {titleCategory} Products
        <span>({filteredProducts.length} items)</span>
      </SectionTitle>

      {loading ? (
        <EmptyState>Loading products...</EmptyState>
      ) : filteredProducts.length ? (
        <ProductGridLayout>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onBuy={handleBuy}
              buyBusy={buyingProductId === product.id}
            />
          ))}
        </ProductGridLayout>
      ) : (
        <EmptyState>
          {normalizeSearchText(searchQuery)
            ? 'No products match your search.'
            : 'No products found for this category.'}
        </EmptyState>
      )}
    </SectionWrap>
  );
};

export default ProductGrid;
