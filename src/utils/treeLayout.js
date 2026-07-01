/**
 * treeLayout.js
 * Calculates coordinate positions for a family tree.
 * Uses a subtree width calculation and Centers parents over children.
 */
import { sortMembersByBirthOrder } from "./sortUtils";


const CARD_WIDTH = 210;
const CARD_HEIGHT = 90;
const SPOUSE_GAP = 16;
const CHILDREN_GAP = 40;
const GENERATION_GAP = 160;
const TOP_PADDING = 50;

export const buildLayout = (members) => {
  // Find Gen 1 members (the roots/founders) who don't have parents in the database
  const gen1List = sortMembersByBirthOrder(members.filter(m => m.generation === 1 && !m.fatherId && !m.motherId));
  
  if (gen1List.length === 0) return { nodes: [], links: [], width: 1000, height: 600 };

  // Track visited nodes to avoid cyclic loops
  const visited = new Set();

  // 1. Build family units recursively
  // A family unit consists of a primary person, their spouse (if any), and their children's units
  const buildUnit = (person) => {
    if (visited.has(person.id)) return null;
    visited.add(person.id);

    // Find primary spouse (the one listed in spouseIds and present in the members array)
    let spouse = null;
    if (person.spouseIds && person.spouseIds.length > 0) {
      spouse = members.find(m => person.spouseIds.includes(m.id)) || null;
      if (spouse) visited.add(spouse.id);
    }

    // Find children. Children are members whose father or mother is this person or their spouse
    const parentIds = [person.id];
    if (spouse) parentIds.push(spouse.id);

    const children = members.filter(m => 
      (m.fatherId && parentIds.includes(m.fatherId)) || 
      (m.motherId && parentIds.includes(m.motherId))
    );

    const sortedChildren = sortMembersByBirthOrder(children);

    const childUnits = sortedChildren
      .map(child => buildUnit(child))
      .filter(unit => unit !== null);

    const unitWidth = spouse ? (CARD_WIDTH * 2 + SPOUSE_GAP) : CARD_WIDTH;

    return {
      id: person.id,
      person,
      spouse,
      children: childUnits,
      unitWidth,
      x: 0,
      y: (person.generation - 1) * GENERATION_GAP + TOP_PADDING,
      subtreeWidth: 0
    };
  };

  // Build units for all Gen 1 founders
  const roots = gen1List
    .map(founder => buildUnit(founder))
    .filter(u => u !== null);

  // 2. Recursively calculate the width of each subtree
  const calculateSubtreeWidth = (unit) => {
    if (!unit) return 0;
    
    if (unit.children.length === 0) {
      unit.subtreeWidth = unit.unitWidth;
      return unit.unitWidth;
    }

    let childrenWidthSum = 0;
    unit.children.forEach((child, index) => {
      childrenWidthSum += calculateSubtreeWidth(child);
      if (index < unit.children.length - 1) {
        childrenWidthSum += CHILDREN_GAP;
      }
    });

    // Subtree width must be at least the parent unit's width
    unit.subtreeWidth = Math.max(unit.unitWidth, childrenWidthSum);
    return unit.subtreeWidth;
  };

  roots.forEach(root => calculateSubtreeWidth(root));

  // 3. Assign X coordinates top-down
  // Start drawing roots next to each other
  let currentStartX = 50;
  
  const assignCoords = (unit, leftBoundary) => {
    if (!unit) return;

    if (unit.children.length === 0) {
      // Leaf node, place at left boundary
      unit.x = leftBoundary;
      unit.centerX = leftBoundary + unit.unitWidth / 2;
    } else {
      // Position all children first
      let childLeft = leftBoundary;
      // If the parent unit is wider than the sum of children, center children under the parent
      const childrenTotalWidth = unit.children.reduce((sum, child, idx) => 
        sum + child.subtreeWidth + (idx < unit.children.length - 1 ? CHILDREN_GAP : 0), 0
      );

      if (unit.unitWidth > childrenTotalWidth) {
        childLeft = leftBoundary + (unit.unitWidth - childrenTotalWidth) / 2;
      }

      unit.children.forEach(child => {
        assignCoords(child, childLeft);
        childLeft += child.subtreeWidth + CHILDREN_GAP;
      });

      // Position parent centered above children
      const firstChildCenter = unit.children[0].centerX;
      const lastChildCenter = unit.children[unit.children.length - 1].centerX;
      const childrenMidpoint = (firstChildCenter + lastChildCenter) / 2;
      
      unit.x = childrenMidpoint - unit.unitWidth / 2;
      unit.centerX = childrenMidpoint;

      // Adjust if parent position is less than leftBoundary
      if (unit.x < leftBoundary) {
        const offset = leftBoundary - unit.x;
        unit.x += offset;
        unit.centerX += offset;
        // Shift children by offset
        const shiftChildren = (u, sh) => {
          u.x += sh;
          u.centerX += sh;
          u.children.forEach(c => shiftChildren(c, sh));
        };
        unit.children.forEach(c => shiftChildren(c, offset));
      }
    }
  };

  roots.forEach((root) => {
    assignCoords(root, currentStartX);
    currentStartX += root.subtreeWidth + CHILDREN_GAP * 2;
  });

  // 4. Flatten the units into a node list and generate connecting SVG paths
  const nodes = [];
  const links = [];

  const collectData = (unit) => {
    if (!unit) return;

    // A. Add primary person node
    nodes.push({
      ...unit.person,
      x: unit.x,
      y: unit.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      isSpouse: false
    });

    let parentConnectorX = unit.x + CARD_WIDTH / 2;

    // B. Add spouse node (if exists)
    if (unit.spouse) {
      const spouseX = unit.x + CARD_WIDTH + SPOUSE_GAP;
      nodes.push({
        ...unit.spouse,
        x: spouseX,
        y: unit.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        isSpouse: true
      });

      // Spouse connection line (horizontal dash)
      const spouseLinkY = unit.y + CARD_HEIGHT / 2;
      links.push({
        type: "spouse",
        path: `M ${unit.x + CARD_WIDTH} ${spouseLinkY} L ${spouseX} ${spouseLinkY}`,
        id: `spouse-${unit.person.id}-${unit.spouse.id}`
      });

      // Midpoint of the couple for the children dropdown line
      parentConnectorX = unit.x + CARD_WIDTH + SPOUSE_GAP / 2;
    }

    // C. Draw lines to children
    if (unit.children.length > 0) {
      const parentBottomY = unit.y + CARD_HEIGHT;
      const verticalDropY = unit.y + CARD_HEIGHT + (GENERATION_GAP - CARD_HEIGHT) / 2;
      const sourceIds = [unit.person.id, unit.spouse?.id].filter(Boolean);
      const childIds = unit.children.map(child => child.person.id);

      // 1. Draw drop line from parent/couple center to the split level
      links.push({
        type: "parent-drop",
        path: `M ${parentConnectorX} ${parentBottomY} L ${parentConnectorX} ${verticalDropY}`,
        id: `drop-${unit.id}`,
        sourceIds,
        childIds
      });

      // 2. Draw horizontal split bar stretching across children
      const firstChildX = unit.children[0].x + CARD_WIDTH / 2;
      const lastChildX = unit.children[unit.children.length - 1].x + CARD_WIDTH / 2;
      
      links.push({
        type: "split-bar",
        path: `M ${firstChildX} ${verticalDropY} L ${lastChildX} ${verticalDropY}`,
        id: `bar-${unit.id}`,
        sourceIds,
        childIds
      });

      // 3. Draw vertical drop line to each child node
      unit.children.forEach(child => {
        const childTopX = child.x + CARD_WIDTH / 2;
        links.push({
          type: "child-entry",
          path: `M ${childTopX} ${verticalDropY} L ${childTopX} ${child.y}`,
          id: `child-line-${child.id}`,
          sourceIds,
          childId: child.person.id
        });

        // Recurse children
        collectData(child);
      });
    }
  };

  roots.forEach(root => collectData(root));

  // Determine bounds for SVG viewBox sizing
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach(node => {
    if (node.x < minX) minX = node.x;
    if (node.x + node.width > maxX) maxX = node.x + node.width;
    if (node.y < minY) minY = node.y;
    if (node.y + node.height > maxY) maxY = node.y + node.height;
  });

  const totalWidth = maxX - minX + 100;
  const totalHeight = maxY - minY + 150;

  return {
    nodes,
    links,
    width: isFinite(totalWidth) ? Math.max(1200, totalWidth) : 1200,
    height: isFinite(totalHeight) ? Math.max(800, totalHeight) : 800
  };
};
