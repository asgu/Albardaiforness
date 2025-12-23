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

    // Build tree structure like Family Echo algorithm
    const addNode = (p: Person, x: number, y: number) => {
      if (addedPersons.has(p.id)) return { x, y };
      
      treeNodes.push({
        person: p,
        x: x * (nodeWidth + horizontalGap),
        y: y * (nodeHeight + verticalGap),
        generation: y,
      });
      addedPersons.add(p.id);
      return { x, y };
    };

    // Add person with parents above
    const addPersonWithAncestors = (p: Person, x: number, y: number, maxGenerations: number): { minX: number; maxX: number } => {
      if (addedPersons.has(p.id)) return { minX: x, maxX: x };
      
      addNode(p, x, y);
      
      let minX = x;
      let maxX = x;

      // Add parents above if we haven't reached max generations
      if (maxGenerations > 0 && (p.father || p.mother)) {
        const parentY = y - 1;
        
        if (p.father && p.mother) {
          // Both parents - place them side by side
          const fatherX = x - 0.6;
          const motherX = x + 0.6;
          
          if (!addedPersons.has(p.father.id)) {
            addNode(p.father, fatherX, parentY);
            minX = Math.min(minX, fatherX);
          }
          
          if (!addedPersons.has(p.mother.id)) {
            addNode(p.mother, motherX, parentY);
            maxX = Math.max(maxX, motherX);
          }
          
          // Add grandparents
          if (maxGenerations > 1) {
            if (p.father.father && !addedPersons.has(p.father.father.id)) {
              addNode(p.father.father, fatherX - 0.6, parentY - 1);
              minX = Math.min(minX, fatherX - 0.6);
            }
            if (p.father.mother && !addedPersons.has(p.father.mother.id)) {
              addNode(p.father.mother, fatherX + 0.6, parentY - 1);
            }
            if (p.mother.father && !addedPersons.has(p.mother.father.id)) {
              addNode(p.mother.father, motherX - 0.6, parentY - 1);
            }
            if (p.mother.mother && !addedPersons.has(p.mother.mother.id)) {
              addNode(p.mother.mother, motherX + 0.6, parentY - 1);
              maxX = Math.max(maxX, motherX + 0.6);
            }
          }
        } else {
          // Single parent
          const parent = p.father || p.mother;
          if (parent && !addedPersons.has(parent.id)) {
            addNode(parent, x, parentY);
          }
        }
      }

      return { minX, maxX };
    };

    // Add children below person
    const addChildren = (p: Person, x: number, y: number) => {
      if (!p.children || p.children.length === 0) return;
      
      const childY = y + 1;
      const childCount = p.children.length;
      const startX = x - (childCount - 1) * 0.5;
      
      p.children.forEach((child, index) => {
        if (!addedPersons.has(child.id)) {
          const childX = startX + index;
          addNode(child, childX, childY);
          
          // Recursively add their children
          addChildren(child, childX, childY);
        }
      });
    };

    // Add siblings horizontally
    const addSiblings = (p: Person, x: number, y: number) => {
      if (!p.siblings || p.siblings.length === 0) return;
      
      p.siblings.forEach((sibling, index) => {
        if (!addedPersons.has(sibling.id)) {
          const siblingX = x + (index + 1) * 1.3;
          addNode(sibling, siblingX, y);
          
          // Add sibling's spouse if any
          if (sibling.spouses && sibling.spouses.length > 0) {
            sibling.spouses.forEach((marriage, spouseIndex) => {
              if (marriage.person && !addedPersons.has(marriage.person.id)) {
                addNode(marriage.person, siblingX + 1.2, y);
              }
            });
          }
          
          // Add sibling's children
          addChildren(sibling, siblingX, y);
        }
      });
    };

    // Add spouse next to person
    const addSpouse = (p: Person, x: number, y: number) => {
      if (!p.spouses || p.spouses.length === 0) return x;
      
      let spouseX = x + 1.2;
      p.spouses.forEach((marriage) => {
        if (marriage.person && !addedPersons.has(marriage.person.id)) {
          addNode(marriage.person, spouseX, y);
          spouseX += 1.2;
        }
      });
      
      return spouseX;
    };

    // Start building from center person
    const centerX = 0;
    const centerY = 0;
    
    // Add main person with ancestors
    addPersonWithAncestors(person, centerX, centerY, 2);
    
    // Add spouse(s)
    addSpouse(person, centerX, centerY);
    
    // Add siblings
    addSiblings(person, centerX, centerY);
    
    // Add children
    addChildren(person, centerX, centerY);

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
              const nodeTop = { x: node.x + 90, y: node.y };
              const nodeBottom = { x: node.x + 90, y: node.y + 100 };
              
              // Draw connection to parents (T-shaped)
              if (node.person.father || node.person.mother) {
                const fatherNode = node.person.father ? nodes.find(n => n.person.id === node.person.father?.id) : null;
                const motherNode = node.person.mother ? nodes.find(n => n.person.id === node.person.mother?.id) : null;
                
                if (fatherNode && motherNode) {
                  // Both parents exist - draw T-connection
                  const fatherBottom = { x: fatherNode.x + 90, y: fatherNode.y + 100 };
                  const motherBottom = { x: motherNode.x + 90, y: motherNode.y + 100 };
                  const midY = nodeTop.y - 30;
                  const parentMidX = (fatherBottom.x + motherBottom.x) / 2;
                  
                  // Horizontal line between parents
                  lines.push(
                    <line
                      key={`parent-line-${index}`}
                      x1={fatherBottom.x}
                      y1={fatherBottom.y}
                      x2={motherBottom.x}
                      y2={motherBottom.y}
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                  );
                  
                  // Vertical line from parents to child
                  lines.push(
                    <path
                      key={`child-line-${index}`}
                      d={`M ${parentMidX} ${fatherBottom.y} L ${parentMidX} ${midY} L ${nodeTop.x} ${midY} L ${nodeTop.x} ${nodeTop.y}`}
                      stroke="#94a3b8"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                } else if (fatherNode || motherNode) {
                  // Single parent
                  const parentNode = fatherNode || motherNode;
                  if (parentNode) {
                    const parentBottom = { x: parentNode.x + 90, y: parentNode.y + 100 };
                    lines.push(
                      <line
                        key={`single-parent-${index}`}
                        x1={parentBottom.x}
                        y1={parentBottom.y}
                        x2={nodeTop.x}
                        y2={nodeTop.y}
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    );
                  }
                }
              }

              // Draw line to spouse (horizontal, marriage line)
              if (node.person.spouses && node.person.spouses.length > 0) {
                node.person.spouses.forEach((marriage, spouseIndex) => {
                  if (marriage.person) {
                    const spouseNode = nodes.find(n => n.person.id === marriage.person?.id);
                    if (spouseNode && spouseNode.generation === node.generation) {
                      const spouseCenter = { x: spouseNode.x + 90, y: spouseNode.y + 50 };
                      lines.push(
                        <line
                          key={`spouse-${index}-${spouseIndex}`}
                          x1={nodeCenter.x}
                          y1={nodeCenter.y}
                          x2={spouseCenter.x}
                          y2={spouseCenter.y}
                          stroke="#10b981"
                          strokeWidth="3"
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

