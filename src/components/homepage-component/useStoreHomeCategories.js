import { useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import { databases } from '../../lib/appwrite.js';
import {
  CATEGORIES_DB_RESPONSE,
  CATEGORY_ALIASES,
  matchesCategorySearch,
  normalizeCategoryValue,
} from './storeHomeData.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';

const isRetailListType = (listTypeValue) => {
  const normalized = String(listTypeValue || '').trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return normalized !== 'auction';
};

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

const mergeCategoryCounts = (productDocs) => {
  const countsByCategory = productDocs.reduce((acc, doc) => {
    const key = normalizeCategoryValue(doc?.category);
    if (!key) {
      return acc;
    }

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return CATEGORIES_DB_RESPONSE.map((category) => {
    const aliases = CATEGORY_ALIASES[category.category_name] || [category.category_name];
    const normalizedAliases = Array.from(new Set(
      [category.category_name, ...aliases]
        .map((alias) => normalizeCategoryValue(alias))
        .filter(Boolean)
    ));

    const totalCount = normalizedAliases.reduce((sum, alias) => {
      return sum + (countsByCategory[alias] || 0);
    }, 0);

    return {
      ...category,
      item_count: totalCount,
    };
  });
};

const useStoreHomeCategories = (searchQuery = '') => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const productDocs = await fetchAllDocuments(PRODUCTS_COLLECTION_ID);
        const retailProductDocs = productDocs.filter((doc) => isRetailListType(doc?.list_type));
        setCategories(mergeCategoryCounts(retailProductDocs));
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(CATEGORIES_DB_RESPONSE);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => matchesCategorySearch(category.category_name, searchQuery));
  }, [categories, searchQuery]);

  const popularCategories = useMemo(() => {
    return filteredCategories.filter((category) => category.is_popular);
  }, [filteredCategories]);

  return {
    loading,
    popularCategories,
    allCategories: filteredCategories,
  };
};

export default useStoreHomeCategories;
