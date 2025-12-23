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
    const nodeWidth = 160;
    const nodeHeight = 220;
    const horizontalGap = 40;
    const verticalGap = 80;
    
    // Tree data structure like original
    interface TreeData {
      l: number;  // left boundary
      r: number;  // right boundary
      t: number;  // top boundary
      b: number;  // bottom boundary
      nodes: Map<string, { x: number; y: number }>;
    }
    
    const treeData: TreeData = {
      l: 0,
      r: 0,
      t: 0,
      b: 0,
      nodes: new Map()
    };
    
    // Add node to tree
    const addNodeToTree = (p: Person, x: number, y: number) => {
      if (addedPersons.has(p.id)) return;
      
      treeNodes.push({
        person: p,
        x: x * (nodeWidth + horizontalGap),
        y: y * (nodeHeight + verticalGap),
        generation: y,
      });
      
      treeData.nodes.set(p.id, { x, y });
      treeData.l = Math.min(treeData.l, x);
      treeData.r = Math.max(treeData.r, x + 1);
      treeData.t = Math.min(treeData.t, y);
      treeData.b = Math.max(treeData.b, y + 1);
      
      addedPersons.add(p.id);
    };
    
    // Build person subtree (BDD from original)
    const buildPersonTree = (p: Person, depth: number): TreeData => {
      const d: TreeData = { l: 0, r: 0, t: 0, b: 0, nodes: new Map() };
      
      if (depth <= 0 || addedPersons.has(p.id)) {
        return d;
      }
      
      // Add person at origin
      addNodeToTree(p, 0, 0);
      d.nodes.set(p.id, { x: 0, y: 0 });
      
      // Determine spouse position (FSM logic)
      const spouseRight = p.gender === 'female';
      let currentSpouseX = spouseRight ? 1.2 : -1.2;
      
      // Add ALL spouses
      if (p.spouses && p.spouses.length > 0) {
        p.spouses.forEach((marriage, index) => {
          if (marriage.person && !addedPersons.has(marriage.person.id)) {
            const spouseX = spouseRight ? currentSpouseX : -currentSpouseX;
            addNodeToTree(marriage.person, spouseX, 0);
            d.nodes.set(marriage.person.id, { x: spouseX, y: 0 });
            d.l = Math.min(d.l, spouseX);
            d.r = Math.max(d.r, spouseX + 1);
            
            // Next spouse further away
            currentSpouseX += 1.2;
          }
        });
      }
      
      // Add children
      if (p.children && p.children.length > 0 && depth > 1) {
        const childCount = p.children.length;
        const startX = -(childCount - 1) * 0.5;
        
        p.children.forEach((child, index) => {
          if (!addedPersons.has(child.id)) {
            const childX = startX + index;
            addNodeToTree(child, childX, 1);
            d.nodes.set(child.id, { x: childX, y: 1 });
            d.l = Math.min(d.l, childX);
            d.r = Math.max(d.r, childX + 1);
            d.b = Math.max(d.b, 2);
          }
        });
      }
      
      // Add siblings
      if (p.siblings && p.siblings.length > 0) {
        // Split siblings by birth year
        const olderSiblings: typeof p.siblings = [];
        const youngerSiblings: typeof p.siblings = [];
        
        p.siblings.forEach((sibling) => {
          const personBirthYear = p.birthYear || 9999;
          const siblingBirthYear = sibling.birthYear || 9999;
          
          if (siblingBirthYear < personBirthYear) {
            olderSiblings.push(sibling);
          } else {
            youngerSiblings.push(sibling);
          }
        });
        
        // Add older siblings to the left
        let leftX = d.l - 1.5;
        olderSiblings.reverse().forEach((sibling) => {
          if (!addedPersons.has(sibling.id)) {
            addNodeToTree(sibling, leftX, 0);
            d.nodes.set(sibling.id, { x: leftX, y: 0 });
            
            // Add sibling's spouses
            if (sibling.spouses && sibling.spouses.length > 0) {
              const sibSpouseRight = sibling.gender === 'female';
              sibling.spouses.forEach((marriage) => {
                if (marriage.person && !addedPersons.has(marriage.person.id)) {
                  const spouseX = sibSpouseRight ? leftX + 1.2 : leftX - 1.2;
                  addNodeToTree(marriage.person, spouseX, 0);
                  d.nodes.set(marriage.person.id, { x: spouseX, y: 0 });
                  d.l = Math.min(d.l, spouseX);
                  d.r = Math.max(d.r, spouseX + 1);
                }
              });
            }
            
            d.l = Math.min(d.l, leftX);
            leftX -= 2.5;
          }
        });
        
        // Add younger siblings to the right
        let rightX = d.r + 0.5;
        youngerSiblings.forEach((sibling) => {
          if (!addedPersons.has(sibling.id)) {
            addNodeToTree(sibling, rightX, 0);
            d.nodes.set(sibling.id, { x: rightX, y: 0 });
            
            // Add sibling's spouses
            if (sibling.spouses && sibling.spouses.length > 0) {
              const sibSpouseRight = sibling.gender === 'female';
              sibling.spouses.forEach((marriage) => {
                if (marriage.person && !addedPersons.has(marriage.person.id)) {
                  const spouseX = sibSpouseRight ? rightX + 1.2 : rightX - 1.2;
                  addNodeToTree(marriage.person, spouseX, 0);
                  d.nodes.set(marriage.person.id, { x: spouseX, y: 0 });
                  d.r = Math.max(d.r, spouseX + 1);
                }
              });
            }
            
            d.r = Math.max(d.r, rightX + 1);
            rightX += 2.5;
          }
        });
      }
      
      // Add parents recursively
      if ((p.father || p.mother) && depth > 1) {
        const parentY = -1;
        
        if (p.father && p.mother) {
          const fatherX = -0.5;
          const motherX = 0.5;
          
          if (!addedPersons.has(p.father.id)) {
            addNodeToTree(p.father, fatherX, parentY);
            d.nodes.set(p.father.id, { x: fatherX, y: parentY });
            d.l = Math.min(d.l, fatherX);
            d.r = Math.max(d.r, fatherX + 1);
            
            // Recursively add father's ancestors
            if (depth > 2 && (p.father.father || p.father.mother)) {
              buildPersonTree(p.father, depth - 1);
            }
          }
          
          if (!addedPersons.has(p.mother.id)) {
            addNodeToTree(p.mother, motherX, parentY);
            d.nodes.set(p.mother.id, { x: motherX, y: parentY });
            d.l = Math.min(d.l, motherX);
            d.r = Math.max(d.r, motherX + 1);
            
            // Recursively add mother's ancestors
            if (depth > 2 && (p.mother.father || p.mother.mother)) {
              buildPersonTree(p.mother, depth - 1);
            }
          }
          
          d.t = Math.min(d.t, parentY);
        } else {
          const parent = p.father || p.mother;
          if (parent && !addedPersons.has(parent.id)) {
            addNodeToTree(parent, 0, parentY);
            d.nodes.set(parent.id, { x: 0, y: parentY });
            d.t = Math.min(d.t, parentY);
            
            // Recursively add parent's ancestors
            if (depth > 2) {
              buildPersonTree(parent, depth - 1);
            }
          }
        }
      }
      
      return d;
    };
    
    // Build main tree
    buildPersonTree(person, 10); // depth 10 for all ancestors
    
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
          <svg 
            className={styles.connections}
            style={{
              width: '10000px',
              height: '10000px',
              position: 'absolute',
              top: '-2000px',
              left: '-2000px',
            }}
          >
            {nodes.map((node, index) => {
              const lines: JSX.Element[] = [];
              const nodeCenter = { x: node.x + 80, y: node.y + 110 };
              const nodeTop = { x: node.x + 80, y: node.y };
              const nodeBottom = { x: node.x + 80, y: node.y + 220 };
              
              // Draw connection to parents (T-shaped)
              if (node.person.father || node.person.mother) {
                const fatherNode = node.person.father ? nodes.find(n => n.person.id === node.person.father?.id) : null;
                const motherNode = node.person.mother ? nodes.find(n => n.person.id === node.person.mother?.id) : null;
                
                if (fatherNode && motherNode) {
                  // Both parents exist - draw T-connection
                  const fatherBottom = { x: fatherNode.x + 80, y: fatherNode.y + 220 };
                  const motherBottom = { x: motherNode.x + 80, y: motherNode.y + 220 };
                  const midY = nodeTop.y - 40;
                  const parentMidX = (fatherBottom.x + motherBottom.x) / 2;
                  
                  // Horizontal line between parents
                  lines.push(
                    <line
                      key={`parent-line-${index}`}
                      x1={fatherBottom.x}
                      y1={fatherBottom.y}
                      x2={motherBottom.x}
                      y2={motherBottom.y}
                      stroke="#666"
                      strokeWidth="2"
                    />
                  );
                  
                  // Vertical line from parents to child
                  lines.push(
                    <path
                      key={`child-line-${index}`}
                      d={`M ${parentMidX} ${fatherBottom.y} L ${parentMidX} ${midY} L ${nodeTop.x} ${midY} L ${nodeTop.x} ${nodeTop.y}`}
                      stroke="#666"
                      strokeWidth="2"
                      fill="none"
                    />
                  );
                } else if (fatherNode || motherNode) {
                  // Single parent
                  const parentNode = fatherNode || motherNode;
                  if (parentNode) {
                    const parentBottom = { x: parentNode.x + 80, y: parentNode.y + 220 };
                    lines.push(
                      <line
                        key={`single-parent-${index}`}
                        x1={parentBottom.x}
                        y1={parentBottom.y}
                        x2={nodeTop.x}
                        y2={nodeTop.y}
                        stroke="#666"
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
                      const spouseCenter = { x: spouseNode.x + 80, y: spouseNode.y + 110 };
                      lines.push(
                        <line
                          key={`spouse-${index}-${spouseIndex}`}
                          x1={nodeCenter.x}
                          y1={nodeCenter.y}
                          x2={spouseCenter.x}
                          y2={spouseCenter.y}
                          stroke="#666"
                          strokeWidth="2"
                        />
                      );
                    }
                  }
                });
              }

              return lines;
            })}
          </svg>

          {nodes.map((node, index) => {
            const genderClass = node.person.gender === 'male' ? styles.male : 
                               node.person.gender === 'female' ? styles.female : 
                               styles.unknown;
            
            return (
              <Link
                key={index}
                href={`/person/${getPersonUrlId(node.person)}`}
                className={styles.node}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
              >
                <div className={`${styles.card} ${genderClass} ${node.person.id === person.id ? styles.current : ''}`}>
                  <div className={styles.avatar}>
                    {node.person.avatarMediaId ? (
                      <img 
                        src={`/api/media/${node.person.avatarMediaId}`} 
                        alt={getFullName(node.person)}
                      />
                    ) : (
                      <div className={styles.noPhoto}>
                        {node.person.gender === 'male' ? '👤' : node.person.gender === 'female' ? '👤' : '?'}
                      </div>
                    )}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.name}>{getFullName(node.person)}</div>
                    <div className={styles.years}>{getLifeYears(node.person)}</div>
                    {node.person.nickName && (
                      <div className={styles.nickname}>"{node.person.nickName}"</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

