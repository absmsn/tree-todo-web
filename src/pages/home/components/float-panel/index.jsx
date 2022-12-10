import styled from "styled-components";
import { FullscreenOutlined } from "@ant-design/icons"

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  height: 32px;
  border-radius: 10%;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  box-shadow: 0 0 10px #e0e0e0;
  border: 1px solid #e0e0e0;
`;

const Icon = styled.div`
  display: inline-flex;
  margin: 4px;
  padding: 4px;
  border-radius: 10%;
  &:hover {
    background-color: ${props => props.selected ? "#bae7ff" : "#f0f0f0"}
  }
  background-color: ${props => props.selected ? "#bae7ff" : "white"}
`;

export default function FloatPanel({ 
  isMouseZoom,
  setIsMouseZoom
}) {
  return (
    <Container>
      <Icon
        selected={isMouseZoom}
        onClick={() => setIsMouseZoom(!isMouseZoom)}
      >
        <FullscreenOutlined />
      </Icon>
    </Container>
  )
}