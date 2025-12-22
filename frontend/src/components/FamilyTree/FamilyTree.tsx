'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Person } from '@/types';
import { Button } from '@/components/ui';
import { getPersonUrlId, getFullName, getLifeYears } from '@/utils/person';
import styles from './FamilyTree.module.scss';

interface FamilyTreeProps {
  person: Person;
}

interface TreeNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export default function FamilyTree({ person }: FamilyTreeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    buildTree();
  }, [person]);

  const buildTree = () => {
    const treeNodes: TreeNode[] = [];
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalGap = 40;
    const verticalGap = 120;

    // Build tree structure
    const addNode = (p: Person, generation: number, position: number, totalSiblings: number) => {
      const x = position * (nodeWidth + horizontalGap);
      const y = generation * (nodeHeight + verticalGap);
      
      treeNodes.push({
        person: p,
        x,
        y,
        generation,
      });

      // Add parents
      if (p.mother || p.father) {
        const parentGeneration = generation - 1;
        let parentPosition = position;

        if (p.father) {
          addNode(p.father, parentGeneration, parentPosition - 0.5, 2);
        }
        if (p.mother) {
          addNode(p.mother, parentGeneration, parentPosition + 0.5, 2);
        }
      }

      // Add children
      if (p.children && p.children.length > 0) {
        const childGeneration = generation + 1;
        p.children.forEach((child, index) => {
          const childPosition = position + (index - p.children!.length / 2 + 0.5);
          addNode(child, childGeneration, childPosition, p.children!.length);
        });
      }
    };

    addNode(person, 2, 0, 1);
    setNodes(treeNodes);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.3, Math.min(2, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className={styles.treeContainer}>
      <div className={styles.controls}>
        <Button 
          onClick={() => setScale(prev => Math.min(2, prev * 1.2))} 
          variant="primary"
          className={styles.zoomButton}
        >
          +
        </Button>
        <Button 
          onClick={() => setScale(prev => Math.max(0.3, prev * 0.8))} 
          variant="primary"
          className={styles.zoomButton}
        >
          -
        </Button>
        <Button 
          onClick={resetView} 
          variant="secondary"
        >
          Reset
        </Button>
        <span className={styles.scaleInfo}>{Math.round(scale * 100)}%</span>
      </div>

      <div
        ref={canvasRef}
        className={styles.canvas}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={styles.tree}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <svg className={styles.connections}>
            {nodes.map((node, index) => {
              const lines: JSX.Element[] = [];
              
              // Draw line to parents
              if (node.person.mother || node.person.father) {
                const parentY = node.y - 120;
                
                if (node.person.father) {
                  const fatherNode = nodes.find(n => n.person.id === node.person.father?.id);
                  if (fatherNode) {
                    lines.push(
                      <line
                        key={`father-${index}`}
                        x1={node.x + 90}
                        y1={node.y}
                        x2={fatherNode.x + 90}
                        y2={fatherNode.y + 100}
                        stroke="#cbd5e1"
                        strokeWidth="2"
                      />
                    );
                  }
                }
                
                if (node.person.mother) {
                  const motherNode = nodes.find(n => n.person.id === node.person.mother?.id);
                  if (motherNode) {
                    lines.push(
                      <line
                        key={`mother-${index}`}
                        x1={node.x + 90}
                        y1={node.y}
                        x2={motherNode.x + 90}
                        y2={motherNode.y + 100}
                        stroke="#cbd5e1"
                        strokeWidth="2"
                      />
                    );
                  }
                }
              }

              return lines;
            })}
          </svg>

          {nodes.map((node, index) => (
            <Link
              key={index}
              href={`/person/${getPersonUrlId(node.person)}`}
              className={styles.node}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
              }}
            >
              <div className={`${styles.card} ${node.person.id === person.id ? styles.current : ''}`}>
                <div className={styles.name}>{getFullName(node.person)}</div>
                <div className={styles.years}>{getLifeYears(node.person)}</div>
                {node.person.nickName && (
                  <div className={styles.nickname}>"{node.person.nickName}"</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

