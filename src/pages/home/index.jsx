import { useState } from "react";
import { observer } from "mobx-react";
import styled from "styled-components";
import Canvas from "./containers/canvas";
import Footer from "./containers/footer";

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const CanvasWrapper = styled.div`
  flex: 1 1 auto;
  display: ${props => props.show ? "" : "none"};
  min-height: 0;
`;

const FooterWrapper = styled.div`
  flex: 0 0 24px;
  border: 1px solid #cfcfcf;
`;

const Home = observer(({ map }) => {
  const [showCanvas, setShowCanvas] = useState(true);

  return (
    <MainContainer className="full-height">
      <CanvasWrapper className="full-height" show={showCanvas}>
        <Canvas map={map} />
      </CanvasWrapper>
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    </MainContainer>
  )
});

export default Home;