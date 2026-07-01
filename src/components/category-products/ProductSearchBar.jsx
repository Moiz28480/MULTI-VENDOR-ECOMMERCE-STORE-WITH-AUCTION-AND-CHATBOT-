import styled from 'styled-components';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  List,
} from 'lucide-react';

const SearchBarWrap = styled.section`
  margin-bottom: 20px;
`;

const ControlsCard = styled.div`
  border: 1px solid #d9dee8;
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 900px) {
    flex-wrap: wrap;
  }
`;

const SearchFieldWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 280px;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 17px;
  height: 17px;
  color: #94a3b8;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  border: 1px solid #cfd8e3;
  border-radius: 9px;
  background: #ffffff;
  padding: 0 14px 0 38px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;

  &::placeholder {
    color: #94a3b8;
    font-weight: 500;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 900px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border: 1px solid #d4dae5;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #334155;
    border-color: #c6ceda;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SelectWrap = styled.div`
  position: relative;
`;

const Dropdown = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-width: 96px;
  height: 36px;
  border: 1px solid #d4dae5;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  padding: 0 30px 0 10px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
`;

const ChevronIcon = styled(ChevronDown)`
  position: absolute;
  right: 9px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: #64748b;
  pointer-events: none;
`;

const ViewToggle = styled.div`
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #d4dae5;
  border-radius: 8px;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  width: 36px;
  height: 36px;
  border: 0;
  background: ${props => (props.$active ? '#eef2ff' : '#ffffff')};
  color: ${props => (props.$active ? '#4f46e5' : '#6b7280')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #334155;
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

const ProductSearchBar = ({ searchQuery = '', onSearchQueryChange }) => {
  return (
    <SearchBarWrap>
      <ControlsCard>
        <SearchFieldWrap>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
          />
        </SearchFieldWrap>

        <RightControls>
          <IconButton type="button" aria-label="Filter options">
            <SlidersHorizontal />
          </IconButton>

          <SelectWrap>
            <Dropdown aria-label="Product filter">
              <option value="all">All</option>
            </Dropdown>
            <ChevronIcon />
          </SelectWrap>

          <ViewToggle>
            <ToggleButton type="button" $active aria-label="Grid view">
              <LayoutGrid />
            </ToggleButton>
            <ToggleButton type="button" aria-label="List view">
              <List />
            </ToggleButton>
          </ViewToggle>
        </RightControls>
      </ControlsCard>
    </SearchBarWrap>
  );
};

export default ProductSearchBar;
