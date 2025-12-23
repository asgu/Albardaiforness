'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Person } from '@/types';
import { Button } from '@/ui';
import { getPersonUrlId, getFullName, getLifeYears } from '@/utils/person';
import styles from './FamilyTree.module.scss';

interface FamilyTreeProps {
  person: Person;
}

// Tree node data structure (like TND in original)
interface TreeData {
  l: number;  // left boundary
  r: number;  // right boundary
  w: number;  // width
  t: number;  // top boundary
  b: number;  // bottom boundary
  h: number;  // height
  e: { [key: string]: TreeNode };  // entities (persons)
  n: TreeLine[];  // lines
}

interface TreeNode {
  p: Person;
  x: number;
  y: number;
  k: boolean;  // key person flag
}

interface TreeLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  k: boolean | null;  // marriage line flag
}

export default function FamilyTree({ person }: FamilyTreeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node dimensions (like TDS in original)
  const nodeWidth = 160;
  const nodeHeight = 220;
  const horizontalGap = 20;
  const verticalGap = 40;

  useEffect(() => {
    const treeData = buildTree();
    renderTree(treeData);
  }, [person]);

  // Create new tree data (TND)
  const TND = (): TreeData => ({
    l: 0,
    r: 0,
    w: 0,
    t: 0,
    b: 0,
    h: 0,
    e: {},
    n: []
  });

  // Add entity to tree (TAE)
  const TAE = (d: TreeData, p: Person, x: number, y: number, k: boolean = false) => {
    d.e[p.id] = { p, x, y, k };
    d.l = Math.min(d.l, x);
    d.r = Math.max(d.r, x + 1);
    d.w = d.r - d.l;
    d.t = Math.min(d.t, y);
    d.b = Math.max(d.b, y + 1);
    d.h = d.b - d.t;
  };

  // Add line to tree (TAL)
  const TAL = (d: TreeData, x1: number, y1: number, x2: number, y2: number, k: boolean | null = false) => {
    d.n.push({ x1, y1, x2, y2, k });
  };

  // Add tree data to another (TAD)
  const TAD = (od: TreeData, d: TreeData, dx: number, dy: number) => {
    // Add lines
    d.n.forEach(n => {
      TAL(od, n.x1 + dx, n.y1 + dy, n.x2 + dx, n.y2 + dy, n.k);
    });
    // Add entities
    Object.values(d.e).forEach(e => {
      TAE(od, e.p, e.x + dx, e.y + dy, e.k);
    });
  };

  // Get gender modifier (FGM)
  const FGM = (gender?: string): number => {
    if (gender === 'female') return -1;
    if (gender === 'male') return 1;
    return 0;
  };

  // Compare persons (FCM)
  const FCM = (p1?: Person, p2?: Person): number => {
    return FGM(p1?.gender) - FGM(p2?.gender);
  };

  // Determine spouse position (FSM)
  const FSM = (person: Person, spouseId?: string): boolean => {
    const spouse = person.spouses?.find(s => s.person?.id === spouseId)?.person;
    const cm = FCM(person, spouse);
    return cm ? cm < 0 : false;
  };

  // Get all children (FLA)
  const FLA = (person: Person): Person[] => {
    return person.children || [];
  };

  // Get children with specific partner (FLP)
  const FLP = (person: Person, partnerId?: string): Person[] => {
    if (!person.children) return [];
    return person.children.filter(child => {
      if (person.gender === 'male') {
        return child.motherId === partnerId;
      } else {
        return child.fatherId === partnerId;
      }
    });
  };

  // Get siblings (FLS)
  const FLS = (person: Person): Person[] => {
    return person.siblings || [];
  };

  // Build children group (BCG)
  const BCG = (children: Person[], depth: number): { ds: TreeData[]; tw: number; fl: number; lr: number; aw: number } => {
    const ds: TreeData[] = [];
    let tw = 0;
    
    children.forEach(child => {
      const d = BDD(child, depth);
      ds.push(d);
      tw += d.w;
    });
    
    const fl = ds[0]?.l || 0;
    const lr = ds[ds.length - 1]?.r || 0;
    
    return {
      ds,
      tw,
      fl,
      lr,
      aw: tw + fl - lr
    };
  };

  // Build children display (BCD)
  const BCD = (d: TreeData, ds: TreeData[], aw: number, cx: number, cy: number, vx: number, vy: number) => {
    const al = cx - aw / 2;
    const ar = cx + aw / 2;
    
    // Vertical line from parent
    if (vx < al || vx > ar) {
      TAL(d, vx, vy, vx, cy - 0.75, false);
      TAL(d, vx, cy - 0.75, cx, cy - 0.75, false);
      TAL(d, cx, cy - 0.75, cx, cy - 0.5, false);
    } else {
      TAL(d, vx, vy, vx, cy - 0.5, false);
    }
    
    // Horizontal line connecting children
    TAL(d, al, cy - 0.5, ar, cy - 0.5, false);
    
    // Add each child
    let x = cx - aw / 2 + ds[0].l;
    ds.forEach(cd => {
      TAL(cd, 0, 0, 0, -0.5, false);
      TAD(d, cd, x - cd.l, cy);
      x += cd.w;
    });
  };

  // Build person with descendants (BDD)
  const BDD = (p: Person, depth: number): TreeData => {
    const d = TND();
    
    if (depth <= 0) {
      TAE(d, p, 0, 0, false);
      return d;
    }
    
    const primarySpouse = p.spouses?.[0]?.person;
    const sr = FSM(p, primarySpouse?.id);
    const sx = sr ? 1 : -1;
    
    // Add person
    TAE(d, p, 0, 0, false);
    
    // Add own children (without specific partner)
    const ac = FLA(p);
    if (ac.length > 0) {
      const childGroup = BCG(ac, depth - 1);
      BCD(d, childGroup.ds, childGroup.aw, 0, 1, 0, 0);
    }
    
    // Add PRIMARY spouse (first one)
    if (primarySpouse) {
      // Children with primary spouse
      const tc = FLP(p, primarySpouse.id);
      
      let finalSx = sx;
      if (tc.length > 0) {
        const childGroup = BCG(tc, depth - 1);
        if (ac.length > 0) {
          finalSx = sr 
            ? d.r + (childGroup.tw - childGroup.fl - childGroup.lr) / 2 + 0.5 
            : d.l - (childGroup.tw + childGroup.lr + childGroup.fl) / 2 - 0.5;
        }
        const cx = sr ? finalSx - 0.5 : finalSx + 0.5;
        BCD(d, childGroup.ds, childGroup.aw, cx, 1, cx, 0);
      }
      
      // Marriage line
      TAL(d, 0, 0, finalSx, 0, true);
      TAE(d, primarySpouse, finalSx, 0, false);
      
      // Primary spouse's own children
      const spouseChildren = FLA(primarySpouse);
      if (spouseChildren.length > 0) {
        const childGroup = BCG(spouseChildren, depth - 1);
        const cx = sr 
          ? d.r + (childGroup.tw - childGroup.fl - childGroup.lr) / 2 
          : d.l - (childGroup.tw + childGroup.lr + childGroup.fl) / 2;
        BCD(d, childGroup.ds, childGroup.aw, cx, 1, finalSx, 0);
      }
      
      // Add OTHER spouses (BDA logic)
      BDA(d, primarySpouse, p.id, depth - 1, sr, finalSx, 0);
    }
    
    // Add person's other partners (excluding primary)
    BDA(d, p, primarySpouse?.id, depth - 1, !sr, 0, 0);
    
    return d;
  };

  // Build different spouses/partners (BDA)
  const BDA = (d: TreeData, person: Person, excludeSpouseId: string | undefined, depth: number, dr: boolean, fx: number, cy: number) => {
    if (!person.spouses || person.spouses.length === 0) return;
    
    person.spouses.forEach(marriage => {
      const spouse = marriage.person;
      if (!spouse || spouse.id === excludeSpouseId) return;
      
      // Get children with this partner
      const children = FLP(person, spouse.id);
      
      if (children.length > 0) {
        const childGroup = BCG(children, depth);
        const cx = dr 
          ? d.r - childGroup.fl + childGroup.aw / 2 
          : d.l - childGroup.lr - childGroup.aw / 2;
        const px = cx + (dr ? 0.5 : -0.5);
        BCD(d, childGroup.ds, childGroup.aw, cx, cy + 1, cx, cy);
        
        // Add spouse
        TAE(d, spouse, px, cy, false);
        TAL(d, fx, cy, px, cy, true);
      } else {
        const px = dr ? d.r : d.l - 1;
        TAE(d, spouse, px, cy, false);
        TAL(d, fx, cy, px, cy, true);
      }
    });
  };

  // Build siblings section (BSS)
  const BSS = (d: TreeData, p: Person, siblings: Person[], depth: number, cy: number): { al: number; ar: number; ll: number; rl: number } => {
    const li: Person[] = [];
    const ri: Person[] = [];
    
    siblings.forEach(sibling => {
      if (FCM(p, sibling) < 0) {
        ri.push(sibling);
      } else {
        li.push(sibling);
      }
    });
    
    const al = BDS(d, li, depth, false, cy);
    const ar = BDS(d, ri, depth, true, cy);
    
    return { al, ar, ll: li.length, rl: ri.length };
  };

  // Build siblings display (BDS)
  const BDS = (d: TreeData, siblings: Person[], depth: number, dr: boolean, cy: number): number => {
    let al = 0;
    
    siblings.forEach((sibling, j) => {
      const sd = BDD(sibling, depth);
      const x = dr ? d.r - sd.l : d.l - sd.r;
      TAD(d, sd, x, cy);
      TAL(d, x, cy, x, cy - 0.5, false);
      al = x;
    });
    
    return al;
  };

  // Build full tree (BFT)
  const buildTree = (): TreeData => {
    const d = BDD(person, 3);  // depth 3 for children
    
    // Add siblings
    const bs = FLS(person);
    if (bs.length > 0) {
      const aa = BSS(d, person, bs, 2, 0);
      TAL(d, aa.al, -0.5, aa.ar, -0.5, false);
    }
    
    // Add parents
    if (person.father || person.mother) {
      TAL(d, 0, 0, 0, -0.5, false);
      
      const px = 0;
      TAL(d, px, -0.5, px, -1, false);
      
      if (person.father && person.mother) {
        const mx = px - 0.5;
        const fx = px + 0.5;
        
        TAL(d, mx, -1, fx, -1, true);
        TAE(d, person.mother, mx, -1, false);
        TAE(d, person.father, fx, -1, false);
        
        // Add grandparents recursively
        addAncestors(d, person.mother, mx, -1, 5);
        addAncestors(d, person.father, fx, -1, 5);
      } else {
        const parent = person.father || person.mother;
        if (parent) {
          TAE(d, parent, px, -1, false);
          addAncestors(d, parent, px, -1, 5);
        }
      }
    }
    
    d.e[person.id].k = true;
    return d;
  };

  // Add ancestors recursively
  const addAncestors = (d: TreeData, p: Person, x: number, y: number, depth: number) => {
    if (depth <= 0 || (!p.father && !p.mother)) return;
    
    TAL(d, x, y, x, y - 0.5, false);
    const py = y - 1;
    
    if (p.father && p.mother) {
      const mx = x - 0.5;
      const fx = x + 0.5;
      
      TAL(d, x, y - 0.5, x, py, false);
      TAL(d, mx, py, fx, py, true);
      
      TAE(d, p.mother, mx, py, false);
      TAE(d, p.father, fx, py, false);
      
      addAncestors(d, p.mother, mx, py, depth - 1);
      addAncestors(d, p.father, fx, py, depth - 1);
    } else {
      const parent = p.father || p.mother;
      if (parent) {
        TAL(d, x, y - 0.5, x, py, false);
        TAE(d, parent, x, py, false);
        addAncestors(d, parent, x, py, depth - 1);
      }
    }
  };

  // Render tree to DOM
  const renderTree = (d: TreeData) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.innerHTML = '';
    
    // Calculate dimensions
    const tw = (nodeWidth + horizontalGap) * d.w - horizontalGap;
    const th = (nodeHeight + verticalGap) * d.h - verticalGap;
    const ox = nodeWidth / 2 - d.l * (nodeWidth + horizontalGap);
    const oy = nodeHeight / 2 - d.t * (nodeHeight + verticalGap);
    
    // Create SVG for lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.width = tw + 'px';
    svg.style.height = th + 'px';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    
    // Draw lines
    d.n.forEach(n => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(ox + n.x1 * (nodeWidth + horizontalGap)));
      line.setAttribute('y1', String(oy + n.y1 * (nodeHeight + verticalGap)));
      line.setAttribute('x2', String(ox + n.x2 * (nodeWidth + horizontalGap)));
      line.setAttribute('y2', String(oy + n.y2 * (nodeHeight + verticalGap)));
      line.setAttribute('stroke', '#666');
      line.setAttribute('stroke-width', n.k ? '3' : '2');
      svg.appendChild(line);
    });
    
    canvas.appendChild(svg);
    
    // Draw nodes
    Object.values(d.e).forEach(e => {
      const node = document.createElement('a');
      node.href = `/person/${getPersonUrlId(e.p)}`;
      node.className = styles.node;
      node.style.position = 'absolute';
      node.style.left = ox + e.x * (nodeWidth + horizontalGap) - nodeWidth / 2 + 'px';
      node.style.top = oy + e.y * (nodeHeight + verticalGap) - nodeHeight / 2 + 'px';
      node.style.zIndex = e.k ? '10' : '2';
      
      const card = document.createElement('div');
      card.className = `${styles.card} ${e.k ? styles.current : ''} ${styles[e.p.gender || 'unknown']}`;
      
      const photo = document.createElement('div');
      photo.className = styles.photo;
      
      if (e.p.avatarMediaId) {
        const img = document.createElement('img');
        img.src = `/api/media/${e.p.avatarMediaId}`;
        img.alt = getFullName(e.p);
        photo.appendChild(img);
      } else {
        const noPhoto = document.createElement('div');
        noPhoto.className = styles.noPhoto;
        photo.appendChild(noPhoto);
      }
      
      const info = document.createElement('div');
      info.className = styles.info;
      
      const name = document.createElement('div');
      name.className = styles.name;
      name.textContent = getFullName(e.p);
      
      const years = document.createElement('div');
      years.className = styles.years;
      years.textContent = getLifeYears(e.p);
      
      info.appendChild(name);
      info.appendChild(years);
      
      if (e.p.nickName) {
        const nickname = document.createElement('div');
        nickname.className = styles.nickname;
        nickname.textContent = `"${e.p.nickName}"`;
        info.appendChild(nickname);
      }
      
      card.appendChild(photo);
      card.appendChild(info);
      node.appendChild(card);
      canvas.appendChild(node);
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
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
        className={styles.canvas}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={canvasRef}
          className={styles.tree}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}
