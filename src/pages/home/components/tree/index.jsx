import Node from "../circle-node";
import Edge from "../edge";
import { observer } from "mobx-react";
import {
  forceLink,
  forceSimulation,
  forceManyBody,
  forceCollide
} from "d3-force";
import { useEffect } from "react";
import eventChannel from "../../../../utils/event";
import { NODE_ADD_CHILD } from "../../../../constants/event";
import { ROOT_NODE_DEFAULT_SIZE } from "../../../../constants/geometry";

const reArrangeTree = (tree) => {
  const nodes = tree.nodes.map((node) => ({
    x: node.x,
    y: node.y,
    id: node.id,
    depth: node.depth,
    r: node.r
  }));
  const links = tree.edges.map(edge => ({
    source: edge.source.id,
    target: edge.target.id
  }));
  forceSimulation(nodes)
    .alpha(0.5)
    .alphaMin(0.1)
    .alphaDecay(0.05)
    .on("end", () => {
      for (let i = 0; i < nodes.length; i++) {
        tree.nodes[i].changePosition(nodes[i].x, nodes[i].y);
      }
    })
    .on("tick", () => {
      for (let i = 0; i < nodes.length; i++) {
        tree.nodes[i].changePosition(nodes[i].x, nodes[i].y);
      }
    })
    .force("link", forceLink(links)
      .id(d => d.id)
      .distance(2 * ROOT_NODE_DEFAULT_SIZE + 10))
    .force("charge", forceManyBody()
      .strength(node => {
        return -(30 - node.depth * 10);
      }))
    .force("collide", forceCollide(d => d.r * 1.25));
}

export default observer(function Tree({ tree, scale }) {
  useEffect(() => {
    const onAddNode = () => reArrangeTree(tree);
    eventChannel.on(NODE_ADD_CHILD, onAddNode);
    return (() => {
      eventChannel.removeListener(NODE_ADD_CHILD, onAddNode);
    });
  }, []);

  return (
    <g>
      {
        tree.nodes.map(node => 
          <Node
            node={node} 
            key={node.id} 
            scale={scale}
          />
        )
      }
      {
        tree.edges.map(edge => 
          <Edge edge={edge} key={edge.edgeID} />
        )
      }
    </g>
  )
});