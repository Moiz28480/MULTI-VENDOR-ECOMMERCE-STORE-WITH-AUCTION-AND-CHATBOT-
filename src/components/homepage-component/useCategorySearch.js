import { useCallback, useState } from 'react';

const useCategorySearch = (initialQuery = '') => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  const handleSearchSubmit = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  return {
    searchQuery,
    handleSearchChange,
    handleSearchSubmit,
  };
};

export default useCategorySearch;
