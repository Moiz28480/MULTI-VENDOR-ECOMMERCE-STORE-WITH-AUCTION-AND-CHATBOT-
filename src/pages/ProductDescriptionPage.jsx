import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Query } from 'appwrite';
import { databases } from '../lib/appwrite.js';
import { addToCartItem } from '../lib/cart.js';
import { useAuth } from '../lib/auth-context.js';
import ImageGallery from '../components/homepage-component/product-page/ImageGallery.jsx';
import ProductInfo from '../components/homepage-component/product-page/ProductInfo.jsx';
import ProductTabs from '../components/homepage-component/product-page/ProductTabs.jsx';
import VendorCard from '../components/homepage-component/product-page/VendorCard.jsx';
import ReviewSection from '../components/homepage-component/product-page/ReviewSection.jsx';
import '../styling/product/ProductDescriptionPage.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const USERS_COLLECTION_ID = 'users';
const REVIEWS_COLLECTION_ID = 'reviews';
const CHATBOT_PRODUCT_CONTEXT_KEY = 'chatbot:product-context';

const safeParseJson = (value, fallback = null) => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const asString = (value, fallback = '') => String(value || fallback).trim();

const extractImages = (doc = {}) => {
  const candidates = [];

  if (Array.isArray(doc.images)) {
    candidates.push(...doc.images);
  }

  const parsedImages = safeParseJson(doc.images);
  if (Array.isArray(parsedImages)) {
    candidates.push(...parsedImages);
  }

  const imageStringFields = [
    doc.imageUrl,
    doc.image_url,
    doc.image,
    doc.thumbnail,
    doc.mainImage
  ];

  candidates.push(...imageStringFields);

  return candidates
    .map((image) => asString(image))
    .filter(Boolean)
    .slice(0, 8);
};

const extractSpecifications = (doc = {}) => {
  const source = doc.specifications || doc.specs;

  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (typeof entry === 'string') {
          return { label: 'Specification', value: entry };
        }

        return {
          label: asString(entry?.label || entry?.name || 'Specification'),
          value: asString(entry?.value || entry?.detail || '-')
        };
      })
      .filter((entry) => entry.value);
  }

  const parsedSpecs = safeParseJson(source);
  if (Array.isArray(parsedSpecs)) {
    return parsedSpecs;
  }

  return [
    { label: 'Category', value: asString(doc.category || 'General') },
    { label: 'Stock', value: `${Number(doc.stock || 0)} units` },
    { label: 'SKU', value: asString(doc.sku || doc.$id || '-') }
  ];
};

const extractShippingInfo = (doc = {}) => {
  if (Array.isArray(doc.shippingInfo)) {
    return doc.shippingInfo.map((item) => asString(item)).filter(Boolean);
  }

  const parsedShipping = safeParseJson(doc.shippingInfo);
  if (Array.isArray(parsedShipping)) {
    return parsedShipping.map((item) => asString(item)).filter(Boolean);
  }

  const summary = [];

  if (doc.shippingEstimate) {
    summary.push(`Shipping: ${asString(doc.shippingEstimate)}`);
  }

  if (doc.returnPolicy) {
    summary.push(`Returns: ${asString(doc.returnPolicy)}`);
  }

  if (!summary.length) {
    summary.push('Delivered in 2-3 business days.');
    summary.push('Returns accepted within 7 days for unused products.');
  }

  return summary;
};

const mapReview = (reviewDoc = {}) => ({
  $id: reviewDoc.$id,
  reviewerName: asString(reviewDoc.reviewerName || reviewDoc.customerName || reviewDoc.name || 'Customer'),
  rating: Number(reviewDoc.rating || 0),
  comment: asString(reviewDoc.comment || reviewDoc.review || reviewDoc.text || ''),
  $createdAt: reviewDoc.$createdAt
});

const ProductDescriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { productId = '' } = useParams();
  const resolvedProductId = decodeURIComponent(productId).trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [addToCartBusy, setAddToCartBusy] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      if (!resolvedProductId) {
        setLoading(false);
        setError('Invalid product id.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const productDoc = await databases.getDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          resolvedProductId
        );

        const vendorId = asString(productDoc.vendor_id || productDoc.vendorId || '');
        const mappedProduct = {
          id: productDoc.$id,
          name: asString(productDoc.name || 'Untitled Product'),
          price: Number(productDoc.price || 0),
          category: asString(productDoc.category || 'General'),
          stock: Number(productDoc.stock || 0),
          description: asString(productDoc.description || ''),
          images: extractImages(productDoc),
          specifications: extractSpecifications(productDoc),
          shippingInfo: extractShippingInfo(productDoc),
          shippingEstimate: asString(productDoc.shippingEstimate || ''),
          warranty: asString(productDoc.warranty || ''),
          packagingNote: asString(productDoc.packagingNote || ''),
          vendorId
        };

        let vendorDoc = null;
        if (vendorId) {
          try {
            vendorDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, vendorId);
          } catch {
            vendorDoc = null;
          }
        }

        const reviewQueries = [
          [Query.equal('productId', [resolvedProductId]), Query.limit(100)],
          [Query.equal('product_id', [resolvedProductId]), Query.limit(100)]
        ];

        let reviewDocs = [];
        for (const queries of reviewQueries) {
          try {
            const response = await databases.listDocuments(
              DATABASE_ID,
              REVIEWS_COLLECTION_ID,
              queries
            );

            if (response?.documents?.length) {
              reviewDocs = response.documents;
              break;
            }
          } catch {
            // Continue trying fallback field names.
          }
        }

        let vendorProductsCount = 0;
        if (vendorId) {
          try {
            const countResponse = await databases.listDocuments(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              [Query.equal('vendorId', [vendorId]), Query.limit(1)]
            );

            vendorProductsCount = Number(countResponse?.total || 0);
          } catch {
            vendorProductsCount = 0;
          }
        }

        const mappedReviews = reviewDocs.map(mapReview);
        const averageRating = mappedReviews.length
          ? mappedReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / mappedReviews.length
          : 0;

        const mappedVendor = {
          id: vendorDoc?.$id || vendorId,
          name: asString(vendorDoc?.name || vendorDoc?.vendor_name || 'Trusted Vendor'),
          username: asString(vendorDoc?.username || vendorDoc?.userName || ''),
          rating: Number(vendorDoc?.rating || vendorDoc?.average_rating || averageRating || 0),
          responseTime: asString(vendorDoc?.responseTime || vendorDoc?.response_time || 'Within 2 hours'),
          productsCount: Number(vendorDoc?.productsCount || vendorDoc?.products_count || vendorProductsCount || 0),
          bio: asString(vendorDoc?.bio || vendorDoc?.description || ''),
          storePath: '/vendor-profile'
        };

        setProduct(mappedProduct);
        setVendor(mappedVendor);
        setReviews(mappedReviews);
      } catch (fetchError) {
        console.error('Failed to load product details:', fetchError);
        setError('Unable to load product details right now.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [resolvedProductId]);

  useEffect(() => {
    if (!product?.id || !product?.vendorId) {
      return;
    }

    const payload = {
      productId: product.id,
      vendorId: product.vendorId,
      vendorName: asString(vendor?.name || ''),
      vendorUsername: asString(vendor?.username || ''),
      updatedAt: new Date().toISOString(),
    };

    sessionStorage.setItem(CHATBOT_PRODUCT_CONTEXT_KEY, JSON.stringify(payload));
  }, [product?.id, product?.vendorId, vendor?.name, vendor?.username]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const handleAddToCart = () => {
    if (!product?.id) {
      return;
    }

    if (!user?.$id) {
      navigate('/login');
      return;
    }

    setAddToCartBusy(true);
    setAddToCartMessage('');

    try {
      addToCartItem(user.$id, product.id, quantity);
      setAddToCartMessage('Added to cart successfully.');
    } finally {
      setAddToCartBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="product-description-page product-description-page--status">
        <p>Loading product details...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-description-page product-description-page--status">
        <p>{error || 'Product not found.'}</p>
      </main>
    );
  }

  return (
    <main className="product-description-page">
      <div className="product-description-layout">
        <div className="product-description-left-column">
          <section className="product-description-hero">
            <ImageGallery images={product.images} title={product.name} />
            <ProductInfo
              product={{ ...product, vendorRating: vendor?.rating }}
              averageRating={averageRating}
              reviewCount={reviews.length}
              quantity={quantity}
              onIncrement={() => setQuantity((value) => Math.min(99, value + 1))}
              onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
              onAddToCart={handleAddToCart}
              addToCartBusy={addToCartBusy}
              addToCartMessage={addToCartMessage}
            />
          </section>

          <ProductTabs
            description={product.description}
            specifications={product.specifications}
            shippingInfo={product.shippingInfo}
          />

          <ReviewSection reviews={reviews} averageRating={averageRating} />
        </div>

        <div className="product-description-right-column">
          <VendorCard
            vendor={vendor}
            onVisitStore={() => {
              if (vendor?.storePath) {
                navigate(vendor.storePath);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
};

export default ProductDescriptionPage;
