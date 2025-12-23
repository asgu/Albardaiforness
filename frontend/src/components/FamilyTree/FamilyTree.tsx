'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Person } from '@/types';
import { Button } from '@/ui';
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
    const addedPersons = new Set<string>();
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalGap = 40;
    const verticalGap = 120;

    // Build tree structure recursively
    const addNode = (p: Person, generation: number, position: number) => {
      if (addedPersons.has(p.id)) return;
      
      const x = position * (nodeWidth + horizontalGap);
      const y = generation * (nodeHeight + verticalGap);
      
      treeNodes.push({
        person: p,
        x,
        y,
        generation,
      });
      addedPersons.add(p.id);

      // Add parents recursively (going up)
      if (p.mother || p.father) {
        const parentGeneration = generation - 1;
        
        if (p.father) {
          addNode(p.father, parentGeneration, position - 0.6);
          // Add father's parents (grandparents)
          if (p.father.mother) addNode(p.father.mother, parentGeneration - 1, position - 1.2);
          if (p.father.father) addNode(p.father.father, parentGeneration - 1, position - 0.8);
        }
        if (p.mother) {
          addNode(p.mother, parentGeneration, position + 0.6);
          // Add mother's parents (grandparents)
          if (p.mother.mother) addNode(p.mother.mother, parentGeneration - 1, position + 1.2);
          if (p.mother.father) addNode(p.mother.father, parentGeneration - 1, position + 0.8);
        }
      }

      // Add siblings
      if (p.siblings && p.siblings.length > 0) {
        p.siblings.forEach((sibling, index) => {
          if (!addedPersons.has(sibling.id)) {
            const siblingPosition = position + (index + 1) * 1.5;
            addNode(sibling, generation, siblingPosition);
          }
        });
      }

      // Add spouses
      if (p.spouses && p.spouses.length > 0) {
        p.spouses.forEach((marriage, index) => {
          if (marriage.person && !addedPersons.has(marriage.person.id)) {
            const spousePosition = position + 1.2 + (index * 0.5);
            addNode(marriage.person, generation, spousePosition);
          }
        });
      }

      // Add children
      if (p.children && p.children.length > 0) {
        const childGeneration = generation + 1;
        const startPosition = position - (p.children.length - 1) * 0.5;
        p.children.forEach((child, index) => {
          if (!addedPersons.has(child.id)) {
            const childPosition = startPosition + index;
            addNode(child, childGeneration, childPosition);
          }
        });
      }
    };

    addNode(person, 0, 0);
    setNodes(treeNodes);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Убрали зум колесом - теперь только кнопками
    e.preventDefault();
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
              const nodeCenter = { x: node.x + 90, y: node.y + 50 };
              
              // Draw line to father
              if (node.person.father) {
                const fatherNode = nodes.find(n => n.person.id === node.person.father?.id);
                if (fatherNode) {
                  const fatherCenter = { x: fatherNode.x + 90, y: fatherNode.y + 50 };
                  lines.push(
                    <path
                      key={`father-${index}`}
                      d={`M ${nodeCenter.x} ${nodeCenter.y} L ${nodeCenter.x} ${nodeCenter.y - 30} L ${fatherCenter.x} ${fatherCenter.y + 80} L ${fatherCenter.x} ${fatherCenter.y + 50}`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                }
              }
              
              // Draw line to mother
              if (node.person.mother) {
                const motherNode = nodes.find(n => n.person.id === node.person.mother?.id);
                if (motherNode) {
                  const motherCenter = { x: motherNode.x + 90, y: motherNode.y + 50 };
                  lines.push(
                    <path
                      key={`mother-${index}`}
                      d={`M ${nodeCenter.x} ${nodeCenter.y} L ${nodeCenter.x} ${nodeCenter.y - 30} L ${motherCenter.x} ${motherCenter.y + 80} L ${motherCenter.x} ${motherCenter.y + 50}`}
                      stroke="#ec4899"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                }
              }

              // Draw line to spouse (horizontal)
              if (node.person.spouses && node.person.spouses.length > 0) {
                node.person.spouses.forEach((marriage, spouseIndex) => {
                  if (marriage.person) {
                    const spouseNode = nodes.find(n => n.person.id === marriage.person?.id);
                    if (spouseNode) {
                      const spouseCenter = { x: spouseNode.x + 90, y: spouseNode.y + 50 };
                      lines.push(
                        <line
                          key={`spouse-${index}-${spouseIndex}`}
                          x1={nodeCenter.x}
                          y1={nodeCenter.y}
                          x2={spouseCenter.x}
                          y2={spouseCenter.y}
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                        />
                      );
                    }
                  }
                });
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

