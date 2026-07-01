import SearchBarComponent from './SearchBarComponent';

const HeroSearchControls = ({
  value,
  onChange,
  onSearch,
}) => {
  return (
    <SearchBarComponent
      value={value}
      onChange={onChange}
      onSearch={onSearch}
    />
  );
};

export default HeroSearchControls;
