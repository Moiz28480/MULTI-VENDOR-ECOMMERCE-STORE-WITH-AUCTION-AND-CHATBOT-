import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #ffffff;
`;

const PageContent = styled.div`
  padding: 24px 24px;

  @media (max-width: 768px) {
    padding: 16px 16px;
  }
`;

const StoreHomeLayout = ({ header, children }) => {
  return (
    <PageWrapper>
      {header}
      <PageContent>{children}</PageContent>
    </PageWrapper>
  );
};

export default StoreHomeLayout;
