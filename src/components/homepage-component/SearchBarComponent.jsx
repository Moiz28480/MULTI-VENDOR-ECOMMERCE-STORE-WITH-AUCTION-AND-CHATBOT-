import styled from 'styled-components';
import { Search } from 'lucide-react';

const SearchForm = styled.form`
  width: 100%;
  max-width: 720px;
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InputWrap = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    background-color: white;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchButton = styled.button`
  height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  width: 18px;
  height: 18px;
  pointer-events: none;
`;

const SearchBarComponent = ({
  value,
  onChange,
  onSearch,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(value || '');
    }
  };

  return (
    <SearchForm onSubmit={handleSubmit}>
      <SearchContainer>
        <InputWrap>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search categories..."
            aria-label="Search categories"
            value={value || ''}
            onChange={(event) => onChange?.(event.target.value)}
          />
        </InputWrap>
        <SearchButton type="submit">Search</SearchButton>
      </SearchContainer>
    </SearchForm>
  );
};

export default SearchBarComponent;
